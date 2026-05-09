import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.body_profile import BodyProfile
from app.models.garment import Garment, SizeChart
from app.models.tryon_task import TryonTask
from app.services.ai_service import call_image_api, quality_check

MAX_RETRIES = 2

def build_user_prompt(bp, garments, scene, pose):
    lines = ["## 用户信息"]
    if bp.height_cm: lines.append("- 身高：" + str(float(bp.height_cm)) + "cm")
    if bp.weight_kg: lines.append("- 体重：" + str(float(bp.weight_kg)) + "kg")
    m = []
    if bp.shoulder_width: m.append("肩宽" + str(float(bp.shoulder_width)) + "cm")
    if bp.chest_circ: m.append("胸围" + str(float(bp.chest_circ)) + "cm")
    if bp.waist_circ: m.append("腰围" + str(float(bp.waist_circ)) + "cm")
    if bp.hip_circ: m.append("臀围" + str(float(bp.hip_circ)) + "cm")
    if m: lines.append("- 体型数据：" + "，".join(m))
    if bp.body_type: lines.append("- 体型分类：" + bp.body_type)
    if bp.body_description: lines.append("- 体型特征：" + bp.body_description)

    lines.append("\n## 穿搭要求\n请让图中人物穿上以下服装：")
    cat_names = {"top": "上衣", "bottom": "裤装", "dress": "连衣裙", "shoes": "鞋履", "accessory": "配饰", "bag": "包袋"}
    for i, g in enumerate(garments):
        parts = ["- [附件" + str(i+1) + "] " + cat_names.get(g.category, g.category) + "：" + (g.name or "未命名")]
        d = []
        if g.color_primary: d.append("颜色：" + g.color_primary)
        if g.material: d.append("材质：" + g.material)
        if g.fit_type: d.append("版型：" + g.fit_type)
        if g.pattern: d.append("图案：" + g.pattern)
        if d: parts.append("  · " + "，".join(d))
        if g.ai_description: parts.append("  · 描述：" + g.ai_description)
        lines.append("\n".join(parts))

    scene_descs = {"studio": "专业摄影棚，白色无缝背景，均匀柔光", "street": "繁华都市街头，自然日光", "indoor": "简约现代风格客厅，柔和灯光", "outdoor": "阳光明媚的户外花园，绿色植物背景"}
    pose_descs = {"front_standing": "正面自然站立，双手自然下垂，目视镜头", "side_45": "身体微侧45度，展示服装侧面轮廓", "walking": "走路中的自然姿态，步伐轻盈", "sitting": "优雅地坐在高脚椅上，双腿交叉"}
    lines.append("\n## 场景与姿势")
    lines.append("- 背景场景：" + scene_descs.get(scene, scene_descs["studio"]))
    lines.append("- 模特姿势：" + pose_descs.get(pose, pose_descs["front_standing"]))
    lines.append("\n## 质量要求\n- 风格：专业时尚摄影风格\n- 特别注意：保持面部特征完全一致，不要改变发型，服装自然穿着")
    return "\n".join(lines)

async def execute_tryon(db: AsyncSession, user_id: str, bp, garment_ids: list, scene: str, pose: str, quality: str, size_overrides: dict = None):
    result = await db.execute(select(Garment).where(Garment.id.in_(garment_ids)).options(selectinload(Garment.size_charts)))
    garments = list(result.scalars().all())
    if not garments:
        raise Exception("未找到指定服装")

    task = TryonTask(user_id=user_id, body_profile_id=bp.id, garment_ids=garment_ids, scene=scene, pose_type=pose, status="processing")
    db.add(task)
    await db.commit()
    await db.refresh(task)

    start = time.time()
    try:
        ref_images = []
        if bp.front_photo_url:
            ref_images.append(bp.front_photo_url)
        for g in garments:
            if len(ref_images) >= 4:
                break
            img = g.processed_image or g.original_image
            if img:
                ref_images.append(img)

        prompt = build_user_prompt(bp, garments, scene, pose)
        result_url = await call_image_api(prompt, ref_images, quality)
        if not result_url:
            raise Exception("生图 API 未返回结果")

        quality_score = 7
        if bp.front_photo_url:
            check = await quality_check(bp.front_photo_url, result_url)
            quality_score = check["score"]
            if not check["pass"]:
                for attempt in range(MAX_RETRIES):
                    prompt = prompt + "\n\n## 优化要求\n" + "；".join(check.get("issues", []))
                    result_url = await call_image_api(prompt, ref_images, quality)
                    check = await quality_check(bp.front_photo_url, result_url)
                    quality_score = check["score"]
                    if check["pass"]:
                        break

        pt = int((time.time() - start) * 1000)
        task.status = "completed"
        task.result_urls = [result_url] if result_url else []
        task.prompt_used = prompt
        task.api_model = "gpt-image-2pro"
        task.api_calls_count = 1 + MAX_RETRIES
        task.processing_time_ms = pt
        task.quality_score = quality_score
        task.completed_at = time.time()
        await db.commit()
        return {"task_id": task.id, "status": "completed", "result_urls": task.result_urls, "quality_score": quality_score}
    except Exception as e:
        task.status = "failed"
        task.error_message = str(e)
        task.processing_time_ms = int((time.time() - start) * 1000)
        await db.commit()
        raise
