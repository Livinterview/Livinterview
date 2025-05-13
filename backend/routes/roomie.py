from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
import httpx, logging
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
import pandas as pd
from fastapi import Query
from typing import Optional, List
from sqlalchemy.sql import text, bindparam

router = APIRouter()
logger = logging.getLogger(__name__)

# .env 파일 로드
load_dotenv()

# DB 연결 엔진 생성
db_url = os.getenv("DB_URL")
if not db_url:
    raise ValueError("DB_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.")

engine = create_engine(db_url)

@router.get("/roomie")
async def roomie(
    contractType: List[str] = Query(default=["월세", "전세"]),
    depositRangeMin: int = Query(default=0),
    depositRangeMax: int = Query(default=12_000),
    monthlyRangeMin: Optional[int] = Query(default=None),
    monthlyRangeMax: Optional[int] = Query(default=None),
    sizeOption: Optional[str] = Query(default="전체"),
):
    try:
        print(f"Received Parameters: contractType={contractType}, depositRangeMin={depositRangeMin}, depositRangeMax={depositRangeMax}, monthlyRangeMin={monthlyRangeMin}, monthlyRangeMax={monthlyRangeMax}, sizeOption={sizeOption}")

    # ✅ 단위 변환 (만원 → 원)
        depositRangeMin *= 10_000
        depositRangeMax *= 10_000
        if monthlyRangeMin is not None:
            monthlyRangeMin *= 10_000
        if monthlyRangeMax is not None:
            monthlyRangeMax *= 10_000

        print(f"[변환 후 단위] 보증금: {depositRangeMin} ~ {depositRangeMax}원")
        print(f"[변환 후 단위] 월세: {monthlyRangeMin} ~ {monthlyRangeMax}원")
        
        params = {
            "contract_types": tuple(contractType),
            "deposit_min": depositRangeMin,
            "deposit_max": depositRangeMax,
        }

        conditions = [
            "area_m2 IS NOT NULL",
            "price_type IN :contract_types",
            "deposit BETWEEN :deposit_min AND :deposit_max",
        ]

        # "월세"일 경우에만 monthly 조건 추가
        if contractType == "월세":
            if monthlyRangeMin is None or monthlyRangeMax is None:
                return {"error": "월세 필터링에는 monthlyRangeMin과 monthlyRangeMax가 필요합니다."}
            conditions.append("monthly BETWEEN :monthly_min AND :monthly_max")
            params["monthly_min"] = monthlyRangeMin
            params["monthly_max"] = monthlyRangeMax
        elif contractType == "전세":
            conditions.append("monthly = 0")
            params["monthly"] = 0

        size_map = {
            "1~5": (3.3, 16.5),
            "5~10": (16.5, 33),
            "10~15": (33, 49.5),
            "15~20": (49.5, 66),
            "20 이상": (66, None),
        }

        if sizeOption in size_map:
            size_min, size_max = size_map[sizeOption]
            if size_max:
                conditions.append("area_m2 BETWEEN :size_min AND :size_max")
                params["size_min"] = size_min
                params["size_max"] = size_max
            else:
                conditions.append("area_m2 > :size_min")
                params["size_min"] = size_min

        where_clause = " AND ".join(conditions)

        query = text(f"""
            SELECT room_title, dong_name, price_type,
                img_url_list, lat, lng, area_m2, deposit, monthly
            FROM Seoul_rooms
            WHERE {where_clause}
        """).bindparams(
            bindparam("contract_types", expanding=True)
        )

        print("query:", str(query))
        print("params:", params)

        df = pd.read_sql(sql=query, con=engine, params=params)
        result = df.to_dict(orient="records")

        # print("Result:", result)

        return result

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"error": f"데이터 조회 실패: {str(e)}"}
    finally:
        engine.dispose()
