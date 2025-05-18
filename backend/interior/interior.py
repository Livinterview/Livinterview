import requests
from dotenv import load_dotenv
from pathlib import Path


# .env 로드
load_dotenv()

# 저장 경로 설정 (지금 프로젝트 기준 상대 경로)
save_path = Path("backend/interior/assets/staged_result.jpg")

# Decor8 AI API Endpoint
url = "https://api.decor8.ai/generate_designs_for_room"

# API 키 불러오기
API_KEY = os.getenv("DECOR8_API_KEY")

# 프롬프트 기반 요청 내용 구성 
# 연결할 때는 챗봇에서 요약한 프롬프트를 반영해서 사용할 예정
payload = {
    "input_image_url": "https://raw.githubusercontent.com/jinheesong/assets/main/test2.png",
    "prompt": """Do not modify or remove any existing furniture, structure, walls, or background.
                Keep the original room exactly as it is.

                Add the following items in Scandinavian style:
                - A beige sofa placed near the window side.
                - A short round table made of light wood positioned in the center of the room.
                - A small side table next to the sofa with a reading lamp on it.
                - A large plant in the far corner of the room near the window.

                Make sure the lighting and shadows match the current scene.
                Do not add or remove anything else.
                """,
    "num_images": 1
}

# 요청 보내기
response = requests.post(
    url,
    headers={
        "Content-Type": "application/json",
        "Authorization": API_KEY
    },
    json=payload
)

# 응답 확인 및 이미지 저장
if response.ok:
    result = response.json()
    print("Decor8 AI 응답:", result)

    # 이미지 URL 추출
    images = result.get("info", {}).get("images", [])
    if images and "url" in images[0]:
        image_url = images[0]["url"]
        image_data = requests.get(image_url)

        # 저장 경로
        save_path = Path("backend/interior/assets/staged_result.jpg")
        save_path.parent.mkdir(parents=True, exist_ok=True)

        with open(save_path, "wb") as f:
            f.write(image_data.content)

        print(f"이미지 저장 완료: {save_path}")
    else:
        print("이미지 URL이 없습니다. 응답 구조를 다시 확인하세요.")
else:
    print("요청 실패:", response.status_code, response.text)
