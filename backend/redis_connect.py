import redis

from core.config import REDIS_HOST, REDIS_PORT, SESSION_EXPIRE_SECONDS, REDIS_PASSWORD

r = redis.Redis(
    host=REDIS_HOST, port=REDIS_PORT, decode_responses=True, password=REDIS_PASSWORD
)


def serialize_dict(d: dict) -> dict:
    return {k: str(v) if isinstance(v, bool) else v for k, v in d.items()}

def create_session(session_id, user_data: dict):
    try:
        serialized = serialize_dict(user_data)
        for k, v in serialized.items():
            r.hset(session_id, k, v)
        r.expire(session_id, SESSION_EXPIRE_SECONDS)
        return session_id
    except Exception as e:
        print(f"Redis session create error: {e}")
        return None

def get_session(session_id: str):
    return r.hgetall(session_id)


def destroy_session(session_id: str):
    r.delete(session_id)
