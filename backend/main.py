from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from core.config import SESSION_SECRET_KEY
from routes.google import router as google_router
from routes.kakao import router as kakao_router
from routes.naver import router as naver_router
from routes.user import router as user_router
from routes.roomie import router as roomie_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if not SESSION_SECRET_KEY:
    raise ValueError("SESSION_SECRET_KEY가 설정되어 있지 않습니다!")

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY,
    same_site="Lax",
    https_only=False,
)

app.include_router(google_router, prefix="/auth/google", tags=["Google"])
app.include_router(kakao_router, prefix="/auth/kakao", tags=["Kakao"])
app.include_router(naver_router, prefix="/auth/naver", tags=["Naver"])
app.include_router(user_router, prefix="/user",tags=["User"])
app.include_router(roomie_router, prefix="/api",tags=["Roomie"])

