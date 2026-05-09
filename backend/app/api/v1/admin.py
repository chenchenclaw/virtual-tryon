from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_token
from app.api.deps import get_current_admin
from app.models.admin import Admin
from app.models.user import User
from app.models.garment import Garment
from app.models.tryon_task import TryonTask
from app.models.body_profile import BodyProfile

router = APIRouter(prefix="/admin", tags=["后台管理"])

@router.post("/login")
async def admin_login(username: str, password: str, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admin).where(Admin.username == username))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(401, "用户名或密码错误")
    token = create_token({"admin_id": admin.id, "role": admin.role})
    response.set_cookie("admin_token", token, httponly=True, samesite="lax", max_age=24*3600)
    return {"success": True, "data": {"token": token, "role": admin.role}}

@router.get("/users")
async def list_users(page: int = 1, size: int = 20, search: str = "", admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    q = select(User).order_by(User.created_at.desc())
    if search:
        q = q.where(User.email.ilike(f"%{search}%") | User.nickname.ilike(f"%{search}%"))
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar()
    result = await db.execute(q.offset((page-1)*size).limit(size))
    users = result.scalars().all()
    return {"success": True, "data": {"items": [{"id": u.id, "email": u.email, "nickname": u.nickname, "gender": u.gender, "created_at": str(u.created_at)} for u in users], "total": total, "page": page, "size": size}}

@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "用户不存在")
    bp_result = await db.execute(select(BodyProfile).where(BodyProfile.user_id == user_id, BodyProfile.is_active == True))
    bp = bp_result.scalar_one_or_none()
    g_count_result = await db.execute(select(func.count()).where(Garment.user_id == user_id))
    g_count = g_count_result.scalar()
    t_count_result = await db.execute(select(func.count()).where(TryonTask.user_id == user_id, TryonTask.status == "completed"))
    t_count = t_count_result.scalar()
    return {"success": True, "data": {"user": {"id": user.id, "email": user.email, "nickname": user.nickname, "gender": user.gender, "birth_year": user.birth_year, "created_at": str(user.created_at)}, "body_profile": {"height_cm": float(bp.height_cm) if bp and bp.height_cm else None, "weight_kg": float(bp.weight_kg) if bp and bp.weight_kg else None, "body_type": bp.body_type if bp else None} if bp else None, "stats": {"garment_count": g_count, "tryon_count": t_count}}}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "用户不存在")
    await db.delete(user)
    await db.commit()
    return {"success": True, "message": "用户已删除"}

@router.get("/stats")
async def get_stats(admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    user_count = (await db.execute(select(func.count()).select_from(User))).scalar()
    garment_count = (await db.execute(select(func.count()).select_from(Garment))).scalar()
    tryon_count = (await db.execute(select(func.count()).where(TryonTask.status == "completed").select_from(TryonTask))).scalar()
    failed_count = (await db.execute(select(func.count()).where(TryonTask.status == "failed").select_from(TryonTask))).scalar()
    return {"success": True, "data": {"user_count": user_count, "garment_count": garment_count, "tryon_success": tryon_count, "tryon_failed": failed_count}}

@router.get("/tryon-tasks")
async def list_tryon_tasks(page: int = 1, size: int = 20, status: str = None, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    q = select(TryonTask).order_by(TryonTask.created_at.desc())
    if status:
        q = q.where(TryonTask.status == status)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    result = await db.execute(q.offset((page-1)*size).limit(size))
    tasks = result.scalars().all()
    return {"success": True, "data": {"items": [{"id": t.id, "user_id": t.user_id, "status": t.status, "scene": t.scene, "quality_score": float(t.quality_score) if t.quality_score else None, "processing_time_ms": t.processing_time_ms, "error_message": t.error_message, "created_at": str(t.created_at)} for t in tasks], "total": total, "page": page, "size": size}}
