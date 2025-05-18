# backend/interior/decor8_client.py

import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DECOR8_API_KEY = os.getenv("DECOR8_API_KEY")
DECOR8_ENDPOINT = "https://api.decor8.ai/generate_designs_for_room"

def request_decor8_design(image_url: str, prompt: str, save_path: Path) -> str:
    """
    Decor8 API를 호출하여 인테리어 이미지를 생성하고, 로컬에 저장한 뒤 저장 경로를 반환
    
    Args:
        image_url (str): GitHub 등에 업로드된 공개 이미지의 URL
        prompt (str): 인테리어 지시 프롬프트
        save_path (Path): 결과 이미지를 저장할 로컬 경로

    Returns:
        str: 저장된 로컬 이미지 경로
    """

    payload = {
        "input_image_url": image_url,
        "prompt": prompt,
        "num_images": 1
    }

    response = requests.post(
        DECOR8_ENDPOINT,
        headers={
            "Content-Type": "application/json",
            "Authorization": DECOR8_API_KEY
        },
        json=payload
    )

    if not response.ok:
        raise RuntimeError(f"[Decor8 요청 실패] {response.status_code} {response.text}")

    result = response.json()
    images = result.get("info", {}).get("images", [])
    image_url = images[0].get("url") if images else None

    if not image_url:
        raise ValueError("Decor8 응답에서 이미지 URL을 찾을 수 없습니다.")

    image_data = requests.get(image_url)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(image_data.content)

    return str(save_path)