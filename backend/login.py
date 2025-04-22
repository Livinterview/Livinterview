from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import httpx
import uvicorn
from dotenv import load_dotenv
from pathlib import Path
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuth

app = FastAPI()

# OAuth 설정
oauth = OAuth()

# 루트 디렉터리에 있는 .env 파일 경로 설정
env_path = Path(__file__).resolve().parents[1] / '.env'
load_dotenv(dotenv_path=env_path)

# SessionMiddleware 추가
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY"),  # .env에서 가져온 시크릿 키
    same_site="lax",  # 또는 "strict", CSRF 보호 강화
    https_only=False  # HTTPS 사용 시 True로 변경
)

origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

# CORS 미들웨어 추가 (React 프론트엔드와의 크로스 도메인 요청 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # React 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#로그인 페이지
@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <h2>Welcome to ZIPUP Login</h2>
    <a href="/auth/google">Login with Google</a><br>
    <a href="/auth/kakao">Login with Kakao</a><br>
    <a href="/auth/naver">Login with Naver</a>
    """
    
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

if not all([GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI]):
    raise RuntimeError("Missing required Google OAuth environment variables")

GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"
    
# 구글 OAuth 클라이언트 등록
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    authorize_url='https://accounts.google.com/o/oauth2/v2/auth',
    access_token_url='https://oauth2.googleapis.com/token',
    userinfo_endpoint='https://www.googleapis.com/oauth2/v2/userinfo',
    client_kwargs={'scope': 'email profile'},
)

#구글 로그인
@app.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)

#구글 콜백 처리
@app.get("/auth/google/callback", response_class=HTMLResponse)
async def google_callback(request: Request):

    # 1. 액세스 토큰 요청
    token = await oauth.google.authorize_access_token(request)

    # 2. 사용자 정보 요청
    user = await oauth.google.get('https://www.googleapis.com/oauth2/v2/userinfo', token=token)
    user_json = user.json()
    
    # 3. 세션에 사용자 정보 저장
    request.session["user_info"] = {
        "name": user_json.get("name", "NoName"),
        "email": user_json.get("email", "NoEmail"),
        "picture": user_json.get("picture", ""),
        "provider": "google"
    }

    # 4. 프로필 페이지로 리다이렉트
    return RedirectResponse("/profile")

#카카오 로그인
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_SECRET")
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")
BASE_SCOPES = ["profile_nickname", "account_email"]


# KAKAO_AUTHORIZE_ENDPOINT = "https://kauth.kakao.com/oauth/authorize"
# ACCESS_TOKEN_ENDPOINT = "https://kauth.kakao.com/oauth/token"
# PROFILE_ENDPOINT = "https://kapi.kakao.com/v2/user/me"

# 카카오 OAuth 클라이언트 등록
oauth.register(
    name='kakao',
    client_id=KAKAO_REST_API_KEY,
    client_secret=KAKAO_CLIENT_SECRET,
    authorize_url='https://kauth.kakao.com/oauth/authorize',
    access_token_url='https://kauth.kakao.com/oauth/token',
    userinfo_endpoint='https://kapi.kakao.com/v2/user/me',
    client_kwargs={'scope': ' '.join(BASE_SCOPES)},
    server_metadata_url='https://kauth.kakao.com/.well-known/openid-configuration',
)

@app.get("/auth/kakao")
async def kakao_login(request: Request):
    redirect_uri = KAKAO_REDIRECT_URI
    return await oauth.kakao.authorize_redirect(request, redirect_uri)

# 카카오 로그인 후 카카오에서 리디렉션될 엔드포인트
# 카카오에서 제공한 인증 코드를 사용하여 액세스 토큰을 요청
@app.get("/auth/kakao/callback")
async def kakao_callback(request: Request, code: str):

    # 1. 토큰 요청
    token = await oauth.kakao.authorize_access_token(request)
    access_token = token["access_token"]
    print("kakao token: "+access_token)

    # 2. 사용자 정보 요청
    user = await oauth.kakao.get('https://kapi.kakao.com/v2/user/me', token=token)
    user_json = user.json()
        
    # 3. 세션 저장
    profile = user_json.get("kakao_account", {}).get("profile", {})
    request.session["user_info"] = {
        "name": profile.get("nickname", "NoName"),
        "email": user_json.get("kakao_account", {}).get("email", "NoEmail"),
        "picture": profile.get("profile_image_url", ""),
        "provider": "kakao"
    }
    
    return RedirectResponse("/profile")


##네이버 
# 네이버 OAuth 등록
oauth.register(
    name='naver',
    client_id=os.getenv("NAVER_CLIENT_ID"),  # .env에 추가
    client_secret=os.getenv("NAVER_CLIENT_SECRET"),  # .env에 추가
    authorize_url='https://nid.naver.com/oauth2.0/authorize',
    authorize_params={'response_type': 'code'},
    access_token_url='https://nid.naver.com/oauth2.0/token',
    userinfo_endpoint='https://openapi.naver.com/v1/nid/me',
    client_kwargs={'scope': 'email name profile_image'},
)
NAVER_REDIRECT_URI = os.getenv("NAVER_REDIRECT_URI")

# 네이버 로그인 시작
@app.get("/auth/naver")
async def naver_login(request: Request):
    redirect_uri = NAVER_REDIRECT_URI
    return await oauth.naver.authorize_redirect(request, redirect_uri)

# 네이버 콜백 처리
@app.get("/auth/naver/callback")
async def naver_callback(request: Request):
    token = await oauth.naver.authorize_access_token(request)
    user = await oauth.naver.get('https://openapi.naver.com/v1/nid/me', token=token)
    user_info = user.json().get("response", {})
    # 세션에 사용자 정보 저장
    request.session["user_info"] = {
        "name": user_info.get("name"),
        "email": user_info.get("email"),
        "picture": user_info.get("profile_image"),
        "provider": "naver",
    }
    return RedirectResponse(url="/profile")  # 기존 사용자 정보 페이지로 리다이렉트

# 사용자 정보를 표시하기 위한 엔드포인트
# 세션에 저장된 액세스 토큰을 사용하여 API에서 사용자 정보를 가져옴
@app.get("/profile", response_class=HTMLResponse)
async def profile(request: Request):
    user = request.session.get("user_info")
    if not user:
        return HTMLResponse("Not logged in", status_code=401)
    
    # provider 이름의 첫 글자를 대문자로 변환
    provider = user.get("provider", "unknown").capitalize()

    html = f"""
    <html>
        <head><title>User Profile</title></head>
        <body style='text-align:center; font-family:sans-serif;'>
            <h1>Welcome, {user['name']}!</h1>
            <img src="{user['picture']}" alt="Profile Picture" width="120"><br>
            <p>Email: {user['email']}</p>
            <p>Logged in with: {provider}</p>
        </body>
    </html>
    """
    return HTMLResponse(html)

@app.get("/logout")
async def logout(request: Request):
    """세션을 초기화하고 메인 페이지로 리다이렉트"""
    request.session.clear()
    return {"message": "Logged out successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)