from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["认证"])

@router.post("/register")
async def register(req: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "邮箱已注册")
    user = User(email=req.email, password_hash=hash_password(req.password), nickname=req.nickname or req.email.split("@")[0])
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_token({"user_id": user.id, "email": user.email})
    response.set_cookie("token", token, httponly=True, samesite="lax", max_age=7*24*3600)
    return {"success": True, "data": {"token": token, "user": _user_dict(user)}}

@router.post("/login")
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "邮箱或密码错误")
    token = create_token({"user_id": user.id, "email": user.email})
    response.set_cookie("token", token, httponly=True, samesite="lax", max_age=7*24*3600)
    return {"success": True, "data": {"token": token, "user": _user_dict(user)}}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"success": True, "message": "已退出登录"}

def _user_dict(u: User) -> dict:
    return {"id": u.id, "email": u.email, "nickname": u.nickname, "avatar_url": u.avatar_url, "gender": u.gender, "created_at": str(u.created_at) if u.created_at else None}
