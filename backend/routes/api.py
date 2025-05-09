from fastapi import Depends, APIRouter, Request
from database import get_db
from sqlalchemy.orm import Session
from models import (
    GenderEnum,
    StateEnum,
    TypeEnum,
    User,
    HomieQuestion,
    HomieAnswer,
    HomieHistory,
    HomieQnAHistory,
    SeoulDongCode,
    SeoulRoom,
    SubwayStation,
    HomieDong,
    HomieDongCoefficient,
)
import pandas as pd
import numpy as np

router = APIRouter()


@router.get("/qna")
def get_questions(db: Session = Depends(get_db)):
    questions = db.query(HomieQuestion).order_by(HomieQuestion.code.asc()).all()
    qna_list = []
    for question in questions:
        question_data = question.to_dict()
        question_data["answers"] = [
            answer.to_dict() for answer in question.homie_answers
        ]
        qna_list.append(question_data)
    return qna_list


@router.post("/report")
async def report(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    answers = body.get("answers", [])
    print(f"{answers = }")
    dongs = db.query(HomieDong).all()
    dong_coefficients = []
    for dong in dongs:
        data = {
            "구": dong.district,
            "동": dong.dong,
        }
        for coefficient in dong.homie_dong_coefficients:
            data[coefficient.sub_category] = float(coefficient.coefficient)
            if coefficient.coefficient is None:
                print(f"{coefficient.coefficient = }")
        dong_coefficients.append(data)

    facility_columns = [
        "지하철",
        "버스",
        "따릉이",
        "편의점",
        "다이소",
        "빨래방",
        "마트",
        "소방",
        "경찰",
        "병원",
        "한의원",
        "약국",
        "산",
        "강",
        "하천",
        "공원",
        "카페",
        "도서관",
        "주민센터",
        "반찬가게",
        "은행",
        "노래방",
        "PC방",
        "영화관",
        "문화생활공간",
        "헬스장",
        "공공체육시설",
    ]
    df = pd.DataFrame(dong_coefficients)
    # vectors: df의 시설 데이터
    vectors = df[facility_columns].values

    # target_vector: 사용자가 주는 벡터
    target_vector = np.array([answers[column] / 100 for column in facility_columns])
    # target_vector = np.zeros(len(facility_columns))

    target_vector = target_vector.reshape(1, -1)

    # === 여기 추가 ===
    # target_vector의 값으로 스케일링 팩터 만들기
    scaling_factors = np.sqrt(target_vector.flatten())
    # scaling_factors = target_vector.flatten()

    # 0일 경우 nan이 되니까, 0인 경우는 그대로 0 유지
    scaling_factors = np.nan_to_num(scaling_factors, nan=0.0)

    # 스케일링 적용
    scaled_vectors = vectors * scaling_factors
    # === 여기까지 추가 ===

    # 거리 계산
    distances = np.linalg.norm(scaled_vectors - target_vector, axis=1)

    # 거리 작은 순서로 top 5
    top_n = 5
    top_n_indices = np.argsort(distances)[:top_n]

    for idx in top_n_indices:
        print(
            f"구: {df.iloc[idx]['구']}, 동: {df.iloc[idx]['동']}, distance: {distances[idx]:.4f}"
        )

    # 결과 출력
    top_n_dongs = df.iloc[top_n_indices][["구", "동"]]

    return {"status": "ok", "received": body}
