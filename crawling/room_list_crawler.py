import json, time, pandas as pd
import requests
import re
from pathlib import Path

# ORM 및 DB 연결
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

import sys
from pathlib import Path
# Livinterview 디렉토리를 sys.path에 추가
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.models import SeoulRoom

load_dotenv()
DATABASE_URL = os.getenv("DB_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ───── 기본 설정 ─────
PAGE_SIZE   = 50
MAX_PAGES   = 20
ZOOM        = 13
USE_MAP     = "naver"
BASE_URL    = "https://www.dabangapp.com/api/v5/room-list/category/one-two/region"

HEADERS = {
    "accept": "application/json, text/plain, */*",
    "user-agent": "Mozilla/5.0",
    "d-api-version": "5.0.0",
    "d-call-type": "web",
    "d-app-version": "1",
    "csrf": "token"
}

FILTERS = {
    "sellingTypeList": ["MONTHLY_RENT", "LEASE"],
    "depositRange": {"min": 0, "max": 999999},
    "priceRange":   {"min": 0, "max": 999999},
    "isIncludeMaintenance": False,
    "pyeongRange": {"min": 0, "max": 999999},
    "useApprovalDateRange": {"min": 0, "max": 999999},
    "roomFloorList": ["GROUND_FIRST", "GROUND_SECOND_OVER", "SEMI_BASEMENT", "ROOFTOP"],
    "roomTypeList":  ["ONE_ROOM", "TWO_ROOM"],
    "dealTypeList":  ["AGENT", "DIRECT"],
    "canParking": False,
    "isShortLease": False,
    "hasElevator": False,
    "hasPano": False,
    "isDivision": False,
    "isDuplex": False,
}

KEEP_COLS = [
    "id", "seq", "roomTypeName", "roomTitle", "roomDesc", "priceTypeName",
    "priceTitle", "randomLocation", "imgUrlList"
]

# ───── roomDesc 파싱 ─────
def parse_room_desc(desc):
    floor, area, fee = None, None, 0
    if isinstance(desc, str):
        parts = [p.strip() for p in desc.split(",")]
        if len(parts) == 3:
            floor = parts[0]
            area_raw = parts[1].replace("m²", "").strip()
            area = float(area_raw) if area_raw else None

            fee_raw = parts[2].replace("관리비", "").strip()
            if "없음" in fee_raw:
                fee = 0
            elif "만" in fee_raw:
                fee = float(fee_raw.replace("만", "")) * 10000
            else:
                fee = float(re.sub(r"[^\d.]", "", fee_raw) or 0)
    return pd.Series([floor, area, int(fee)])

# ───── 가격 정보 파싱 ─────
def parse_price_info(row):
    price_type = row.get('priceTypeName', '')
    price_info = row.get('priceTitle', '')
    deposit, monthly = 0, 0

    if isinstance(price_info, str):
        if price_type == "월세":
            deposit_monthly = re.match(r"(\d*\.?\d+)/(\d*\.?\d+)", price_info)
            if deposit_monthly:
                deposit = int(parse_money(deposit_monthly.group(1))) or 0
                monthly = int(parse_money(deposit_monthly.group(2))) or 0
        elif price_type == "전세":
            deposit = parse_money(price_info)
            monthly = 0
    return pd.Series([deposit, monthly])

# ───── 금액 문자열 → 숫자 ─────
def parse_money(money_str):
    money = 0
    parts = re.findall(r"(\d*\.?\d+)\s*(억|만|천)?", money_str.strip())

    for num, unit in parts:
        num = float(num)
        if unit == "억":
            money += num * 1e8
        elif unit == "만":
            money += num * 1e4
        elif unit == "천":
            money += num * 1e3
        else:
            money += num * 1e4  # 단위 없으면 만원 단위
    return int(money) if money > 0 else None

# ───── 크롤링 ─────
def crawl_all_dongs():

    """
    서울시 법정동 코드 리스트를 바탕으로
    다방 API에서 원룸/투룸 매물 데이터를 크롤링한 뒤,
    전처리된 pandas DataFrame을 반환합니다.
    """

    session = SessionLocal()
    dong_df = pd.read_sql("SELECT * FROM Seoul_dong_codes", session.bind)
    dong_df["code"] = dong_df["code"].astype(str)

    all_rows = []

    for _, row in dong_df.iterrows():
        dong_code = row["code"]
        dong_name = row["dong_name"]
        gu_name   = row["gu_name"]
        region_code = dong_code[:8]
        bbox = {
            "sw": {"lat": 37.4451338, "lng": 126.925623},
            "ne": {"lat": 37.5546292, "lng": 127.0488759}
        }

        print(f"{gu_name} {dong_name}({region_code}) 수집 시작")
        rows = []
        for page in range(1, MAX_PAGES + 1):
            params = {
                "filters": json.dumps(FILTERS, separators=(',', ':')),
                "bbox": json.dumps(bbox, separators=(',', ':')),
                "zoom": ZOOM,
                "useMap": USE_MAP,
                "page": page,
                "code": region_code,
            }

            try:
                r = requests.get(BASE_URL, headers=HEADERS, params=params, timeout=20)
            except requests.exceptions.ReadTimeout:
                print(f"[{dong_name}] page {page}: ReadTimeout 발생. 해당 페이지 스킵")
                break

            if r.status_code != 200:
                print(f"[{dong_name}] page {page}: HTTP {r.status_code} → 재시도 중 …")
                time.sleep(1)
                for _ in range(2):
                    try:
                        r = requests.get(BASE_URL, headers=HEADERS, params=params, timeout=20)
                        if r.status_code == 200:
                            break
                    except requests.exceptions.ReadTimeout:
                        continue
                    time.sleep(1)
                else:
                    print("   계속 실패, 루프 중단")
                    break

            data = r.json()["result"]
            rows.extend(data["roomList"])
            for premium_block in data.get("premiumList", []):
                rows.extend(premium_block["roomList"])

            if not data.get("hasMore"):
                break
            time.sleep(0.5)

        for r in rows:
            r["dong_code"] = dong_code
            r["dong_name"] = dong_name
            r["gu_name"] = gu_name
            if isinstance(r.get("randomLocation"), dict):
                r["lat"] = r["randomLocation"].get("lat")
                r["lng"] = r["randomLocation"].get("lng")

        all_rows.extend(rows)

    session.close()

    if all_rows:
        df = pd.DataFrame(all_rows)
        df[["floor", "area_m2", "maintenance_fee"]] = df["roomDesc"].apply(parse_room_desc)
        df[["deposit", "monthly"]] = df.apply(parse_price_info, axis=1)
        df = df[["dong_code", "gu_name", "dong_name"] + KEEP_COLS + ["lat", "lng", "floor", "area_m2", "deposit", "monthly", "maintenance_fee"]]
        return df
    else:
        print("⛔ 저장할 데이터가 없습니다.")
        return pd.DataFrame()
