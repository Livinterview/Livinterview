from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
import httpx, logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/roomie")
async def roomie(request: Request):
    # 임시 데이터 반환
    dummy_rooms = [
    {
        "id": "1",
        "title": "홍대역 도보 3분 원룸",
        "address": "서울시 마포구 양화로",
        "lat": 37.5563,
        "lng": 126.9220,
        "price": "6000만",
        "size": 18,
        "imageUrl": ""
    },
    {
        "id": "2",
        "title": "강남역 근처 투룸",
        "address": "서울시 강남구 테헤란로",
        "lat": 37.4979,
        "lng": 127.0276,
        "price": "8500만",
        "size": 28,
        "imageUrl": ""
    },
    {
        "id": "3",
        "title": "건대입구 신축 원룸",
        "address": "서울시 광진구 능동로",
        "lat": 37.5407,
        "lng": 127.0690,
        "price": "7200만",
        "size": 20,
        "imageUrl": ""
    },
    {
        "id": "4",
        "title": "신촌역 도보 5분 투룸",
        "address": "서울시 서대문구 신촌로",
        "lat": 37.5551,
        "lng": 126.9366,
        "price": "7800만",
        "size": 25,
        "imageUrl": ""
    },
    {
        "id": "5",
        "title": "이태원역 근처 원룸",
        "address": "서울시 용산구 이태원로",
        "lat": 37.5345,
        "lng": 126.9943,
        "price": "6500만",
        "size": 19,
        "imageUrl": ""
    },
    {
        "id": "6",
        "title": "여의도역 근처 오피스텔",
        "address": "서울시 영등포구 여의대로",
        "lat": 37.5216,
        "lng": 126.9247,
        "price": "9000만",
        "size": 30,
        "imageUrl": ""
    },
    {
        "id": "7",
        "title": "사당역 도보 2분 원룸",
        "address": "서울시 동작구 남부순환로",
        "lat": 37.4765,
        "lng": 126.9816,
        "price": "6200만",
        "size": 17,
        "imageUrl": ""
    },
    {
        "id": "8",
        "title": "압구정역 근처 투룸",
        "address": "서울시 강남구 압구정로",
        "lat": 37.5271,
        "lng": 127.0285,
        "price": "9500만",
        "size": 32,
        "imageUrl": ""
    },
    {
        "id": "9",
        "title": "명동역 근처 원룸",
        "address": "서울시 중구 정동길",
        "lat": 37.5607,
        "lng": 126.9851,
        "price": "7000만",
        "size": 21,
        "imageUrl": ""
    },
    {
        "id": "10",
        "title": "동대문역 신축 투룸",
        "address": "서울시 중구 장충단로",
        "lat": 37.5658,
        "lng": 127.0079,
        "price": "8000만",
        "size": 27,
        "imageUrl": ""
    },
    {
        "id": "11",
        "title": "성수역 근처 원룸",
        "address": "서울시 성동구 아차산로",
        "lat": 37.5446,
        "lng": 127.0569,
        "price": "6800만",
        "size": 20,
        "imageUrl": ""
    },
    {
        "id": "12",
        "title": "합정역 도보 4분 오피스텔",
        "address": "서울시 마포구 독막로",
        "lat": 37.5487,
        "lng": 126.9135,
        "price": "8200만",
        "size": 26,
        "imageUrl": ""
    },
    {
        "id": "13",
        "title": "노원역 근처 원룸",
        "address": "서울시 노원구 동일로",
        "lat": 37.6542,
        "lng": 127.0568,
        "price": "5900만",
        "size": 18,
        "imageUrl": ""
    },
    {
        "id": "14",
        "title": "수유역 근처 투룸",
        "address": "서울시 강북구 도봉로",
        "lat": 37.6380,
        "lng": 127.0252,
        "price": "7500만",
        "size": 24,
        "imageUrl": ""
    },
    {
        "id": "15",
        "title": "구로역 도보 3분 원룸",
        "address": "서울시 구로구 구로중앙로",
        "lat": 37.5030,
        "lng": 126.8819,
        "price": "6100만",
        "size": 19,
        "imageUrl": ""
    },
    {
        "id": "16",
        "title": "신림역 근처 투룸",
        "address": "서울시 관악구 신림로",
        "lat": 37.4842,
        "lng": 126.9297,
        "price": "7700만",
        "size": 25,
        "imageUrl": ""
    },
    {
        "id": "17",
        "title": "잠실역 근처 오피스텔",
        "address": "서울시 송파구 올림픽로",
        "lat": 37.5113,
        "lng": 127.0982,
        "price": "8800만",
        "size": 29,
        "imageUrl": ""
    },
    {
        "id": "18",
        "title": "천호역 도보 5분 원룸",
        "address": "서울시 강동구 천호대로",
        "lat": 37.5378,
        "lng": 127.1271,
        "price": "6400만",
        "size": 20,
        "imageUrl": ""
    },
    {
        "id": "19",
        "title": "판교역 근처 투룸",
        "address": "경기도 성남시 분당구 백현로",
        "lat": 37.3948,
        "lng": 127.1112,
        "price": "9200만",
        "size": 31,
        "imageUrl": ""
    },
    {
        "id": "20",
        "title": "일산역 근처 원룸",
        "address": "경기도 고양시 일산동구 중앙로",
        "lat": 37.6820,
        "lng": 126.7699,
        "price": "5700만",
        "size": 17,
        "imageUrl": ""
    }
]
    return JSONResponse(content=dummy_rooms)

