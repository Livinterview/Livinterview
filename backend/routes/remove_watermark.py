from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageDraw
import cv2, numpy as np, torch, os, traceback
from diffusers import StableDiffusionInpaintPipeline, DDIMScheduler
from urllib.parse import urljoin
import shutil
from torch.cuda.amp import autocast

API_BASE = "http://localhost:8000"

router = APIRouter()
UPLOAD_DIR = "./data/uploads"

device = "cuda" if torch.cuda.is_available() else "cpu"
pipe = StableDiffusionInpaintPipeline.from_pretrained(
    "stabilityai/stable-diffusion-2-inpainting",
    torch_dtype=torch.float16,
    revision="fp16"
).to(device)

DEBUG_DIR = "./data/debug"
os.makedirs(DEBUG_DIR, exist_ok=True)

# ──────────────────────────────────────────────
# 유틸 ─ 이미지/확장자 탐색 + 더미 마스크 생성
# ──────────────────────────────────────────────
def find_existing_image_path(image_id: str) -> str:
    for ext in (".jpg", ".jpeg", ".png"):
        path = os.path.join(UPLOAD_DIR, f"{image_id}{ext}")
        if os.path.isfile(path):
            return path
    return ""

def get_watermark_mask(image_path: str) -> Image.Image:
    """
    다방 워터마크(중앙 약간 아래)에 맞춰
    비율 기반 사각형 마스크를 생성
    """
    img = cv2.imread(image_path)
    h, w = img.shape[:2]

    # ── 박스 크기 (비율) ──────────────────────────────
    box_w = int(w * 0.50)         # 가로 50 %
    box_h = int(h * 0.28)         # 세로 28 %

    # ── 박스 위치 : 화면 중앙보다 55 % 지점(=약간 아래) ─
    cx   = w // 2                 # 중심 x
    cy   = int(h * 0.55)          # 중심 y (55 % 아래)

    x1 = max(0, cx - box_w // 2)
    x2 = min(w, cx + box_w // 2)
    y1 = max(0, cy - box_h // 2)
    y2 = min(h, cy + box_h // 2)

    # ── 마스크 작성 ─────────────────────────────────
    mask = np.zeros((h, w), dtype=np.uint8)
    mask[y1:y2, x1:x2] = 255      # 워터마크 영역만 흰색

    return Image.fromarray(mask)


# ──────────────────────────────────────────────
# API
# ──────────────────────────────────────────────
class WatermarkRequest(BaseModel):
    image_id: str

@router.post("/remove-watermark")
async def remove_watermark(req: WatermarkRequest):
    try:
        img_path = find_existing_image_path(req.image_id)
        if not img_path:
            raise HTTPException(404, "이미지를 찾을 수 없음")
        
        print(f"[INFO] 원본 이미지: {img_path}")

        orig = Image.open(img_path).convert("RGB")
        mask = get_watermark_mask(img_path)

        # 디버깅 저장
        debug_mask_path = os.path.join(DEBUG_DIR, f"{req.image_id}_mask.png")
        debug_orig_path = os.path.join(DEBUG_DIR, f"{req.image_id}_orig.jpg")
        orig.save(debug_orig_path)
        mask.save(debug_mask_path)
        print(f"[INFO] 마스크 저장 완료: {debug_mask_path}")

        img_512  = orig.resize((512, 512), Image.LANCZOS)
        mask_512 = mask.resize((512, 512), Image.LANCZOS)

        # 디바이스 & 메모리 디버깅 로그
        print("[DEBUG] torch.cuda.is_available:", torch.cuda.is_available())
        print("[DEBUG] pipe.unet.device:", next(pipe.unet.parameters()).device)
        print("[DEBUG] VRAM allocated:", torch.cuda.memory_allocated() / 1e6, "MB")
        print("[DEBUG] VRAM reserved:", torch.cuda.memory_reserved() / 1e6, "MB")

        with autocast(enabled=(device == "cuda")):
            result = pipe(
                prompt="same background, no watermark, realistic completion",
                image=img_512,
                mask_image=mask_512,
                guidance_scale=7.5,
                num_inference_steps=20  # step 줄이는 것도 병행 추천
            ).images[0]

        # 인페인팅 결과를 한번만 리사이즈하고, 두 번 저장
        final_result = result.resize(orig.size, Image.LANCZOS)

        # 기존 uploads 덮어쓰기 대신 results 디렉토리 저장
        output_path = os.path.join("./data/results", f"{req.image_id}_final.jpg")
        final_result.save(output_path)

        # ⬇ uploads 폴더에 동일 이름으로 덮어쓰기
        upload_path = os.path.join("./data/uploads", f"{req.image_id}.jpg")
        shutil.copy(output_path, upload_path)

        return {
            "cleaned_url": urljoin(API_BASE, output_path.replace("./data", "/data").replace("\\", "/"))
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"워터마크 제거 중 오류: {e}")
