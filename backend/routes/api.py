from fastapi import Depends, APIRouter, Request
from database import get_db
from sqlalchemy.orm import Session
from models import (
    HomieQuestion,
    HomieDong,
)
import pandas as pd
import numpy as np
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

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

    categories = db.query(HomieQuestion.main_category, HomieQuestion.sub_category).all()
    sub_to_main = dict()
    main_to_sub = dict()
    for category in categories:
        sub_to_main[category.sub_category] = category.main_category
        if main_to_sub.get(category.main_category, None):
            main_to_sub[category.main_category].append(category.sub_category)
        else:
            main_to_sub[category.main_category] = [category.sub_category]
    print(sub_to_main)
    print(main_to_sub)

    main_categories = ["교통", "편의", "안전", "건강", "자연", "생활", "놀이", "운동"]
    indicators = dict()
    for k, v in answers.items():
        main_category = sub_to_main.get(k, None)
        if main_category in main_categories and isinstance(v, int):
            indicators.setdefault(main_category, {})[k] = v
    print(f"{indicators = }")
    avg_indicators = {
        k: int(sum(v.values()) / len(v.values())) for k, v in indicators.items()
    }
    print(f"{avg_indicators = }")
    offset = int(sum(avg_indicators.values()) / len(avg_indicators.values())) - 10
    print(f"{offset = }")
    top_indicators = [
        k for k, _ in sorted(avg_indicators.items(), key=lambda x: -x[1])[:3]
    ]
    print(f"{top_indicators = }")

    important_indicators = dict()
    for indicator in top_indicators:
        buff = [
            sub_category
            for sub_category in main_to_sub[indicator]
            if isinstance(answers[sub_category], int) and answers[sub_category] > offset
        ]
        # important_indicators.append({indicator: buff})
        important_indicators[indicator] = buff
    print(f"{important_indicators = }")
    strings = [
        ", ".join(important_indicators[indicator]) for indicator in top_indicators
    ]

    text1 = f"집을 찾으실 때 다양한 부분들을 복합적으로 고려하시겠지만, {strings[0]}등의 시설이 집 근처에 있는지를 중요하게 생각하시는 군요. 그 외 {strings[1]}는 얼마나 가까운 곳에 있는지, {strings[2]}등이 집과 가까운지 등을 신경 쓰시는 스타일이시네요."
    text2 = f"실제 내가 살아보면 어떨까에 대해 생각하면서 여러 요소를 꼼꼼하게 확인하고 주거지를 고르는 당신을 위해 {'하고, '.join(top_indicators)} 한 동을 찾아볼게요!"
    print(text1, text2, sep="\n")
    llm = ChatOpenAI(temperature=0.3, model="gpt-4o-mini")
    user_prompt = PromptTemplate.from_template(
        """
        당신은 두 줄의 텍스트를 전달받습니다.
        당신의 역할은 그룹별로 카테고리를 묶어서 설명하고 조사와 부사를 적절하게 변경하여 자연스러운 문장을 만드는 것입니다.
        문장의 순서를 바꾸지 마세요.

        텍스트 1:
        {text1}
        
        텍스트 2:
        {text2}
        """
    )
    intro_chain = user_prompt | llm
    # intro_completion = intro_chain.invoke({"text1": text1, "text2": text2})
    # print(f"{intro_completion.content = }")
    strings = []
    for main_category in indicators.keys():
        sub_indicators = indicators[main_category]
        values = sorted(set(sub_indicators.values()))
        values = [value for value in values if value != 0]
        print(f"{values = }")
        buff = []
        # for sub_category in sub_indicators.keys():
        #     buff.append(f"{sub_category}: {sub_indicators[sub_category]}")
        for value in values:
            indicator_list = [
                sub_category
                for sub_category in sub_indicators.keys()
                if sub_indicators[sub_category] == value
            ]
            buff.append(f"{', '.join(indicator_list)}: {value}")
        strings.append("[" + ", ".join(buff) + "]")
    strings = "\n\n".join(strings)
    print(f"{strings = }")
    indicator_prompt = PromptTemplate.from_template(
        """
        [시스템]
        너는 사용자가 주거지를 고를 때 각 시설의 ‘중요도’를 자연스러운 한국어 한 문장으로 설명하는 카피라이터다.

        [규칙]
        1. 입력은 “시설명[, 시설명 …]: 숫자” 형태가 빈 줄(\\n\\n)로 구분돼 들어온다.
        2. 한 줄마다 정확히 한 문장을 만든다.
        3. 숫자에 따라 아래 표현 중 하나를 골라 서술한다. (굵은 글씨는 예시·변형 허용)
        · 25 → ‘선호도가 낮음, 필요성이 낮음, 자주 이용하지 않음’  
        · 50 → ‘평소 선호함, 상대적으로 중요하게 생각함’  
        · 75 → ‘선호도가 높은 편임, 자주 이용함’  
        · 100 → ‘선호도가 매우 높음, 필수라고 생각함’
        4. 시설이 복수이면 조사로 자연스럽게 묶고, 필요하면 “집 근처에 위치하는 것에” 같은 부사구를 삽입한다.
        5. 출력은 줄 수를 유지하며, 문장 끝에 마침표를 찍는다.

        [예시]
        입력: 카페, 도서관: 75  
        출력: 카페와 도서관을 집에서 가까운 곳에 두는 것을 선호함.
        입력: 경찰: 25
        출력: 경찰서가 집에서 가까울 필요는 없음.
        입력: 편의점 100
        출력: 편의점을 자주 이용함.
        입력: 다이소 25
        출력: 다이소는 자주 이용하지 않음.


        입력:
        {strings}
        """
    )
    indicator_chain = indicator_prompt | llm
    indicator_completion = indicator_chain.invoke({"strings": strings})
    print(f"{indicator_completion.content = }")

    return {"status": "ok", "received": body}
