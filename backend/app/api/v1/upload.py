import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import settings
from PIL import Image
import io

router = APIRouter(prefix="/upload", tags=["上传"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

async def save_upload(file: UploadFile, subdir: str = "general") -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "仅支持 JPG/PNG/WebP 格式")
    data = await file.read()
    if len(data) > settings.MAX_FILE_SIZE:
        raise HTTPException(400, "文件大小不能超过 10MB")
    img = Image.open(io.BytesIO(data))
    img.thumbnail((1024, 1024), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=80)
    buf.seek(0)
    upload_dir = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(upload_dir, exist_ok=True)
    filename = str(uuid.uuid4()) + ".webp"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(buf.read())
    return "/uploads/" + subdir + "/" + filename

@router.post("")
async def upload_file(file: UploadFile = File(...), type: str = "general", user: User = Depends(get_current_user)):
    url = await save_upload(file, type)
    return {"success": True, "data": {"url": url}}
