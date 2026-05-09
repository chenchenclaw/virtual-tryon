import httpx
from app.core.config import settings

async def call_chat_api(messages: list[dict], model: str = None, max_tokens: int = 800) -> str:
    model = model or settings.OPENAI_MODEL
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(settings.OPENAI_BASE_URL + "/chat/completions", json={"model": model, "max_tokens": max_tokens, "messages": messages}, headers={"Authorization": "Bearer " + settings.OPENAI_API_KEY, "Content-Type": "application/json"})
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

async def call_image_api(prompt: str, reference_images: list[str], quality: str = "high") -> str:
    model = settings.OPENAI_IMAGE_MODEL
    size = "2048x2048" if quality == "high" else "1024x1024"
    body = {"model": model, "n": 1, "size": size, "prompt": prompt, "response_format": "b64_json"}
    if reference_images:
        body["reference_images"] = reference_images
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(settings.OPENAI_IMAGE_BASE_URL + "/images/generations", json=body, headers={"Authorization": "Bearer " + settings.OPENAI_IMAGE_API_KEY, "Content-Type": "application/json"})
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [{}])[0].get("url", "")

async def recognize_garment(image_url: str) -> dict:
    messages = [
        {"role": "system", "content": "你是服装识别AI。分析服装图片，返回纯JSON格式属性信息。"},
        {"role": "user", "content": [
            {"type": "text", "text": '分析这张服装图片，返回JSON：{"category":"上衣/裤装/裙装/鞋履/配饰/包袋","sub_category":"T恤/衬衫/牛仔裤等","color_primary":"主色","material":"材质","pattern":"纯色/条纹等","style":"休闲/商务等","fit_type":"修身/标准/宽松","details":"设计细节","name":"建议名称"}'},
            {"type": "image_url", "image_url": {"url": image_url}}
        ]}
    ]
    content = await call_chat_api(messages)
    import json, re
    m = re.search(r'\{.*\}', content, re.DOTALL)
    return json.loads(m.group()) if m else {}

async def quality_check(user_photo_url: str, generated_url: str) -> dict:
    messages = [
        {"role": "system", "content": "你是试穿质量评估AI。返回纯JSON。"},
        {"role": "user", "content": [
            {"type": "text", "text": '对比两张图：图1用户原照，图2试穿效果。评分1-10。返回：{"score":8,"pass":true,"issues":[]}'},
            {"type": "image_url", "image_url": {"url": user_photo_url}},
            {"type": "image_url", "image_url": {"url": generated_url}}
        ]}
    ]
    content = await call_chat_api(messages, max_tokens=500)
    import json, re
    m = re.search(r'\{.*\}', content, re.DOTALL)
    raw = json.loads(m.group()) if m else {"score": 7, "pass": True, "issues": []}
    raw.setdefault("score", 7)
    raw.setdefault("pass", raw["score"] >= 6)
    raw.setdefault("issues", [])
    return raw
