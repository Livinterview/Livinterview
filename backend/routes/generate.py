# backend/routes/generate.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from chatbot_core.chains.decor8_chain import get_decor8prompt_chain
from chatbot_core.memory.session_memory import get_memory
from interior.decor8_client import request_decor8_design
from interior.github_uploader import upload_image_to_github
from pathlib import Path

router = APIRouter()
load_dotenv()

class GenerateRequest(BaseModel):
    session_id: str
    image_id: str
    prompt: str | None = None 
    is_clean: bool

@router.post("/generate-image")
async def generate_image(req: GenerateRequest):
    try:
        # 1) 메모리에서 대화 및 요약 불러오기
        memory = get_memory(req.session_id)

        # 디버깅: 저장된 메시지 출력
        for m in memory.chat_memory.messages:
            print("📌", m.content)

        variables = memory.load_memory_variables({})
        summary = variables.get("confirmed_summary") or req.prompt
        if not summary:
            raise ValueError("요약 결과가 없습니다. 프롬프트도 전달되지 않았습니다.")


        # 2) 프롬프트 생성 (대화 요약 기반)
        base_prompt = get_decor8prompt_chain().run({
            "summary": summary
        }).strip()

        final_prompt = f"""
        Do not modify or remove any existing furniture, structure, walls, or background.
        Keep the original room exactly as it is.

        {base_prompt}

        Keep the additions minimal and spaced out.
        Leave open areas untouched to preserve the room's spaciousness.

        Make sure the lighting and shadows match the current scene.
        Do not make any further changes beyond the specified additions.
        """.strip()

        # 프롬프트 로그 출력
        print("[Final Decor8 Prompt]")
        print(final_prompt)
        print("[End of Prompt]")

        # 3) Decor8 기반 이미지 생성
        # 청소 여부에 따라 배경 선택
        if req.is_clean:                                                # 청소본 사용
            image_path = Path(f"./data/results/{req.image_id}/sd_inpainted_room.png")
        else:                                                           # 워터마크 제거본 사용
            wm = Path(f"./data/uploads/{req.image_id}_wm.jpg")
            image_path = wm if wm.exists() else Path(f"./data/uploads/{req.image_id}.jpg")

        if not image_path.exists():
            raise HTTPException(404, "배경 이미지가 없습니다.")

        # GitHub에 업로드하고 raw 이미지 URL 받기
        raw_image_url = upload_image_to_github(image_path)

        # Decor8 API로 요청
        save_path = Path(f"./data/staged/{req.image_id}_staged.jpg")
        result_path = request_decor8_design(image_url=raw_image_url, prompt=final_prompt, save_path=save_path)

        # 프론트에서 볼 수 있게 경로 정리
        result_url = str(result_path).replace("\\", "/")

        # ./data 혹은 data 폴더를 /data로 교체 (앞에 / 보장)
        if result_url.startswith("./data"):
            result_url = result_url.replace("./data", "/data")
        elif result_url.startswith("data"):
            result_url = result_url.replace("data", "/data")

        # 완성된 URL
        full_url = f"http://localhost:8000{result_url}"

        return {"image_url": full_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
