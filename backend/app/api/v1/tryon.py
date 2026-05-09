from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.body_profile import BodyProfile
from app.models.garment import Garment, SizeChart
from app.models.tryon_task import TryonTask
from app.schemas.tryon import TryonRequest
from app.services.tryon_service import execute_tryon

router = APIRouter(prefix="/tryon", tags=["虚拟试穿"])

@router.post("")
async def create_tryon(req: TryonRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not req.garment_ids:
        raise HTTPException(400, "请选择至少一件服装")
    if req.body_profile_id:
        result = await db.execute(select(BodyProfile).where(BodyProfile.id == req.body_profile_id, BodyProfile.user_id == user.id))
    else:
        result = await db.execute(select(BodyProfile).where(BodyProfile.user_id == user.id, BodyProfile.is_active == True))
    bp = result.scalar_one_or_none()
    if not bp:
        raise HTTPException(400, "请先创建体型档案")
    task_result = await execute_tryon(db, user.id, bp, req.garment_ids, req.scene, req.pose, req.quality, req.size_overrides)
    return {"success": True, "data": task_result}

@router.get("/history")
async def tryon_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TryonTask).where(TryonTask.user_id == user.id).order_by(TryonTask.created_at.desc()).limit(20))
    tasks = result.scalars().all()
    return {"success": True, "data": [_task_dict(t) for t in tasks]}

@router.get("/{task_id}")
async def get_task_status(task_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TryonTask).where(TryonTask.id == task_id, TryonTask.user_id == user.id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "任务不存在")
    return {"success": True, "data": _task_dict(task)}

def _task_dict(t: TryonTask) -> dict:
    return {"task_id": t.id, "status": t.status, "result_urls": t.result_urls or [], "quality_score": float(t.quality_score) if t.quality_score else None, "retry_count": t.retry_count, "processing_time_ms": t.processing_time_ms, "error_message": t.error_message, "created_at": str(t.created_at) if t.created_at else None, "completed_at": str(t.completed_at) if t.completed_at else None}
