import asyncio
from sqlalchemy import select
from app.core.database import engine, async_session
from app.core.database import Base
from app.core.security import hash_password
from app.models import *  # noqa
from app.models.admin import Admin
from app.core.config import settings

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session() as db:
        result = await db.execute(select(Admin).where(Admin.username == settings.ADMIN_USERNAME))
        if not result.scalar_one_or_none():
            admin = Admin(username=settings.ADMIN_USERNAME, password_hash=hash_password(settings.ADMIN_PASSWORD), role="super_admin")
            db.add(admin)
            await db.commit()
            print("Admin created: " + settings.ADMIN_USERNAME)
        else:
            print("Admin already exists")

asyncio.run(init())
