from fastapi import Depends, APIRouter, Request
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from models import HomieQuestion, HomieDong, SubwayStation, SubwayAdjacentDong
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
    json_data = {}
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

    # 거리 작은 순서로 top 3
    top_n = 3
    top_n_indices = np.argsort(distances)[:top_n]

    # 결과 출력
    top_n_dongs = df.iloc[top_n_indices]
    print(f"{top_n_dongs = }")

    categories = db.query(HomieQuestion.main_category, HomieQuestion.sub_category).all()
    sub_to_main = dict()
    main_to_sub = dict()
    for category in categories:
        sub_to_main[category.sub_category] = category.main_category
        if main_to_sub.get(category.main_category, None):
            main_to_sub[category.main_category].append(category.sub_category)
        else:
            main_to_sub[category.main_category] = [category.sub_category]

    main_categories = ["교통", "편의", "안전", "건강", "녹지", "생활", "놀이", "운동"]
    indicators = dict()
    for k, v in answers.items():
        main_category = sub_to_main.get(k, None)
        if main_category in main_categories and isinstance(v, int):
            indicators.setdefault(main_category, {})[k] = v
    # print(f"{indicators = }")
    avg_indicators = {
        k: int(sum(v.values()) / len(v.values())) for k, v in indicators.items()
    }
    json_data["8_indicators"] = avg_indicators
    # print(f"{avg_indicators = }")
    offset = int(sum(avg_indicators.values()) / len(avg_indicators.values())) - 10
    # print(f"{offset = }")
    top_indicators = [
        k for k, _ in sorted(avg_indicators.items(), key=lambda x: -x[1])[:3]
    ]
    # print(f"{top_indicators = }")
    json_data["top_indicators"] = top_indicators

    important_indicators = dict()
    for indicator in top_indicators:
        buff = [
            sub_category
            for sub_category in main_to_sub[indicator]
            if isinstance(answers[sub_category], int) and answers[sub_category] > offset
        ]
        important_indicators[indicator] = buff
    print(f"{important_indicators = }")
    context = [
        important_indicators[main_cat] for main_cat in important_indicators.keys()
    ]
    context.append(top_indicators)
    context = ", ".join(["[" + ", ".join(element) + "]" for element in context])
    print(f"{context = }")

    llm = ChatOpenAI(temperature=0.3, model="gpt-4o-mini")
    user_prompt = PromptTemplate.from_template(
        """
        [시스템]
        너는 사용자가 주거지를 고를 때 각 시설의 ‘중요도’를 자연스러운 한국어 한 문장으로 설명하는 카피라이터다.

        [예시]
        입력: [대형 마트, 은행, 우체국], [경찰서], [지하철], [안전, 편의]
        출력: 집을 찾으실 때 다양한 부분들을 복합적으로 고려하시겠지만, 집 근처 대형 마트, 은행, 우체국 등의 시설이 집 근처에 있는지를 중요하게 생각하시는 군요. 그 외 경찰서는 집에서 얼마나 가까운 곳에 있는지, 집 근처 지하철 역의 위치 등이 집과 가까운지 등을 신경 쓰시는 스타일이시네요.
        
        
        실제 내가 살아보면 어떨까에 대해 생각하면서 여러 요소를 꼼꼼하게 확인하고 주거지를 고르는 당신을 위해 안전하면서도 편안함이 있는 동을 추천해드릴게요!

        입력: [지하철, 버스, 따릉이],[카페, 도서관], [빨래방, 마트], [교통, 생활]
        출력: 집을 찾으실 때 다양한 부분들을 복합적으로 고려하시겠지만, 집 근처에 지하철, 버스, 따릉이 등 교통시설이 있는지를 중요하게 생각하시는군요. 그 외 근처에 카페, 도서관 등의 생활시설이 집 근처에 있는지, 집 근처 빨래방, 마트 등이 집과 가까운지 등을 신경 쓰시는 스타일이시네요.
        

        실제 내가 살아보면 어떨까에 대해 생각하면서 여러 요소를 꼼꼼하게 확인하고 주거지를 고르는 당신을 위해 안전하면서도 편안함이 있는 동을 추천해드릴게요!

        입력: {context}
        출력:
        """
    )
    intro_chain = user_prompt | llm
    intro_completion = intro_chain.invoke({"context": context})
    # print(f"{intro_completion.content = }")
    intro_text = intro_completion.content.split("\n\n")
    json_data["intro_text"] = intro_text
    context = []
    for main_category in main_categories:
        sub_indicators = indicators[main_category]
        values = sorted(set(sub_indicators.values()))
        # values = [value for value in values]
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
        context.append("[" + ", ".join(buff) + "]")
    context = "\n\n".join(context)
    print(f"{context = }")
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
        입력: [버스: 25, 지하철: 100]\\n\\n
        출력: 버스 정류장에 대한 중요성이 낮지만, 지하철역의 개수와 위치를 상대적으로 중요하게 생각하는 편임.
        입력: [경찰: 25, 소방:25]\\n\\n
        출력: 집 근처 안전관련 기관 등을 중요하게 생각하지 않음.
        입력: [도서관:25, 주민센터, 은행: 50]\\n\\n
        출력: 종종 주민센터, 은행 등을 방문함.
        입력: [다이소 25]\\n\\n
        출력: 다이소는 자주 이용하지 않음.


        입력: {context}
        출력: 
        """
    )
    indicator_chain = indicator_prompt | llm
    indicator_completion = indicator_chain.invoke({"context": context})
    print(f"{indicator_completion.content = }")
    indicator_discriptions = {
        category: sentence.strip()
        for category, sentence in zip(
            main_categories, indicator_completion.content.split("\n")
        )
    }
    print(f"{indicator_discriptions = }, {len(indicator_discriptions) = }")
    json_data["8_indicator_discriptions"] = indicator_discriptions
    numeric_cols = top_n_dongs.select_dtypes(include="number").columns
    top_n_dongs_indicators = []
    for _, row in top_n_dongs.iterrows():
        s = pd.to_numeric(row[numeric_cols], errors="coerce")
        top2 = s.nlargest(2)
        (col1, val1), (col2, val2) = top2.items()  # 라벨·값 튜플 두 개
        top_n_dongs_indicators.append([sub_to_main[col1], sub_to_main[col2]])
    json_data["recommended"] = []
    for idx, dong in enumerate(top_n_dongs.itertuples()):
        context = []
        dong_name = dong.동
        context.append(dong_name)
        dong = db.execute(
            select(HomieDong).filter_by(dong=dong_name)
        ).scalar_one_or_none()
        if dong is None:
            raise ValueError(f"'{dong_name}' 동을 찾을 수 없습니다.")

        # 2) 그 동에 '속한' 역들
        primary_q = select(SubwayStation).where(SubwayStation.homie_dong_id == dong.id)
        primary_stations = db.scalars(primary_q).all()

        # 3) 그 동과 '인접'한 역들 (중계 테이블 이용)
        adjacent_q = (
            select(SubwayStation)
            .join(
                SubwayAdjacentDong,
                SubwayAdjacentDong.subway_station_id == SubwayStation.id,
            )
            .where(SubwayAdjacentDong.homie_dong_id == dong.id)
            .distinct(SubwayStation.id)
        )
        adjacent_stations = db.scalars(adjacent_q).all()

        print(f"{primary_stations = }")
        print(f"{adjacent_stations = }")

        # 4) 중복 제거 및 결과 구성
        buff = []
        for station in primary_stations + adjacent_stations:
            buff.append((station.line, station.name))
        context.append(buff)
        context.append(top_n_dongs_indicators[idx])
        context = str(context)[1:-1]
        print(f"{context = }")
        dong_prompt = PromptTemplate.from_template(
            """
            [시스템]
            너는 사용자가 주거지를 고를 때 각 동에 대한 자연스러운 한국어 문장으로 설명하는 카피라이터다.

            [규칙]
            

            [예시]
            입력: 역촌동, [(6호선, 응암역), (6호선, 구산역), (6호선, 역촌역)], [생활, 안전]
            출력: 역촌동은 지하철 6호선이 지나가는 응암역, 구산역, 역촌역 근처에 있는 동네로, 서울 북서부에 위치한 동네입니다.

            역촌동에서 조금만 남쪽으로 내려오면 응암역 근처부터 불광천이 시작합니다. 이 불광천에는 봄에는 벚꽃이, 그리고 여름, 가울에는 축제가 많이 펼쳐집니다.

            동네에는 크고 작은 다세대주택이 많아 거주하고 있는 사람들이 매우 많은 동네라, 다양한 가게들뿐 아니라 생활과 관련된 시설이 잘 되어있습니다.

            입력: 중곡동, [(7호선, 중곡역), (5·7호선, 군자역), (7호선, 어린이대공원역)], [교통, 편의]
            출력: 중곡동은 지하철 7호선 중곡역, 어린이대공원역과 5·7호선 환승역인 군자역을 끼고있어, 강남·강북·도심 어느 방향으로도 30분 내 접근이 가능한 교통 요충지입니다.

            중곡로와 천호대로를 통해 올림픽대로·강변북로·동부간선도로에 쉽게 진입할 수 있고, 시내·광역버스 노선도 다양해 자가용·대중교통 모두 편리합니다.

            동네 중심부의 중곡시장과 먹자골목은 신선 식재료와 다양한 맛집으로 유명하고, 대형마트(이마트 자양점·코스트코 하남점 차량 15분), 스타시티·롯데백화점 건대스타시티점 같은 복합쇼핑몰이 인접해 쇼핑 선택지가 풍부합니다.

            입력: {context}
            출력: 
            """
        )
        dong_chain = dong_prompt | llm
        dong_completion = dong_chain.invoke({"context": context})
        print(f"{dong_completion.content = }")
        dong_data = {
            "name": dong_name,
            "location": f"서울특별시 {dong.district} {dong_name}",
            "strong_indicators": top_n_dongs_indicators[idx],
            "description": [
                content.strip() for content in dong_completion.content.split("\n\n")
            ],
        }
        json_data["recommended"].append(dong_data)
    print(f"{json_data = }")
    return json_data
