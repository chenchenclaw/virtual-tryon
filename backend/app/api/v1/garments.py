from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.garment import Garment, SizeChart
from app.schemas.garment import GarmentCreate, SizeChartRequest

router = APIRouter(prefix="/garments", tags=["单品管理"])

@router.get("")
async def list_garments(category: str = None, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(Garment).where(Garment.user_id == user.id).order_by(Garment.created_at.desc())
    if category:
        q = q.where(Garment.category == category)
    result = await db.execute(q)
    garments = result.scalars().all()
    data = [{"id": g.id, "name": g.name, "category": g.category, "fit_type": g.fit_type, "color_primary": g.color_primary, "material": g.material, "pattern": g.pattern, "original_image": g.original_image, "created_at": str(g.created_at) if g.created_at else None} for g in garments]
    return {"success": True, "data": data}

@router.post("")
async def create_garment(req: GarmentCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    g = Garment(user_id=user.id, **req.model_dump(exclude_none=True))
    db.add(g)
    await db.commit()
    await db.refresh(g)
    return {"success": True, "data": {"id": g.id, "name": g.name, "category": g.category}}

@router.get("/{garment_id}")
async def get_garment(garment_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Garment).where(Garment.id == garment_id, Garment.user_id == user.id).options(selectinload(Garment.size_charts)))
    g = result.scalar_one_or_none()
    if not g:
        raise HTTPException(404, "单品不存在")
    charts = [{"id": sc.id, "size_label": sc.size_label, "chest": float(sc.chest) if sc.chest else None, "shoulder": float(sc.shoulder) if sc.shoulder else None, "waist_circ": float(sc.waist_circ) if sc.waist_circ else None, "hip_circ": float(sc.hip_circ) if sc.hip_circ else None} for sc in g.size_charts] if hasattr(g, 'size_charts') and g.size_charts else []
    return {"success": True, "data": {"id": g.id, "name": g.name, "category": g.category, "color_primary": g.color_primary, "material": g.material, "fit_type": g.fit_type, "original_image": g.original_image, "size_charts": charts}}

@router.delete("/{garment_id}")
async def delete_garment(garment_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Garment).where(Garment.id == garment_id, Garment.user_id == user.id))
    g = result.scalar_one_or_none()
    if not g:
        raise HTTPException(404, "单品不存在")
    await db.delete(g)
    await db.commit()
    return {"success": True}

@router.post("/size-chart")
async def save_size_chart(req: SizeChartRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Garment).where(Garment.id == req.garment_id, Garment.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "单品不存在")
    await db.execute(delete(SizeChart).where(SizeChart.garment_id == req.garment_id))
    for i, s in enumerate(req.sizes):
        sc = SizeChart(garment_id=req.garment_id, size_system=s.size_system, size_label=s.size_label, chest=s.chest, shoulder=s.shoulder, sleeve_length=s.sleeve_length, total_length=s.total_length, waist_circ=s.waist_circ, hip_circ=s.hip_circ, inseam=s.inseam, thigh_circ=s.thigh_circ, front_rise=s.front_rise, foot_length=s.foot_length, foot_width=s.foot_width, sort_order=s.sort_order or i)
        db.add(sc)
    await db.commit()
    return {"success": True, "data": {"count": len(req.sizes)}}

@router.get("/size-chart/{garment_id}")
async def get_size_chart(garment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SizeChart).where(SizeChart.garment_id == garment_id).order_by(SizeChart.sort_order))
    charts = result.scalars().all()
    return {"success": True, "data": [{"id": c.id, "size_label": c.size_label, "chest": float(c.chest) if c.chest else None, "shoulder": float(c.shoulder) if c.shoulder else None, "waist_circ": float(c.waist_circ) if c.waist_circ else None, "hip_circ": float(c.hip_circ) if c.hip_circ else None, "inseam": float(c.inseam) if c.inseam else None, "foot_length": float(c.foot_length) if c.foot_length else None} for c in charts]}

# Garment 模型添加 size_charts relationship
from sqlalchemy.orm import relationship
if not hasattr(Garment, 'size_charts'):
    Garment.size_charts = relationship("SizeChart", lazy="selectin")
