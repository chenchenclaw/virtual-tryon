from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.body_profile import BodyProfile
from app.schemas.body import BodyProfileCreate

router = APIRouter(prefix="/body", tags=["体型档案"])

@router.get("/profile")
async def get_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BodyProfile).where(BodyProfile.user_id == user.id, BodyProfile.is_active == True))
    bp = result.scalar_one_or_none()
    if not bp:
        return {"success": True, "data": None}
    return {"success": True, "data": _bp_dict(bp)}

@router.post("/profile")
async def create_or_update_profile(req: BodyProfileCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BodyProfile).where(BodyProfile.user_id == user.id, BodyProfile.is_active == True))
    bp = result.scalar_one_or_none()
    if bp:
        for k, v in req.model_dump(exclude_none=True).items():
            setattr(bp, k, v)
    else:
        bp = BodyProfile(user_id=user.id, **req.model_dump(exclude_none=True))
        db.add(bp)
    await db.commit()
    await db.refresh(bp)
    return {"success": True, "data": _bp_dict(bp)}

@router.post("/upload-photo")
async def upload_photo(side: str = "front", file: UploadFile = File(...), user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.api.v1.upload import save_upload
    url = await save_upload(file, "body")
    result = await db.execute(select(BodyProfile).where(BodyProfile.user_id == user.id, BodyProfile.is_active == True))
    bp = result.scalar_one_or_none()
    if not bp:
        bp = BodyProfile(user_id=user.id)
        db.add(bp)
    if side == "front":
        bp.front_photo_url = url
    else:
        bp.side_photo_url = url
    await db.commit()
    return {"success": True, "data": {"url": url, "side": side}}

def _bp_dict(bp: BodyProfile) -> dict:
    return {c.name: (float(getattr(bp, c.name)) if getattr(bp, c.name) is not None and isinstance(getattr(bp, c.name), (int, float)) else getattr(bp, c.name)) for c in bp.__table__.columns}
