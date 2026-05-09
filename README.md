# AI 虚拟试穿平台

基于 AI 的在线虚拟试穿系统，用户上传照片和身材数据后，自由搭配服装，由 AI 生成逼真的全身穿搭效果图。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React 18 + TypeScript + Tailwind CSS |
| 后端 | Python FastAPI + SQLAlchemy + Alembic |
| 数据库 | PostgreSQL 16 + Redis 7 |
| AI 语言模型 | 小米 mimo-v2.5（中转站） |
| AI 生图模型 | hfsyapi gpt-image-2pro（中转站，支持 reference_images） |
| 图片处理 | Pillow（后端）/ sharp（前端上传压缩） |
| 部署 | Docker + Docker Compose |

## 项目结构

```
chuanda/
├── src/                    # Next.js 前端
│   ├── app/
│   │   ├── (auth)/         # 登录/注册
│   │   ├── (main)/         # 主应用（体型/衣橱/试穿/个人中心）
│   │   └── admin/          # 后台管理（概览/用户管理/试穿监控）
│   ├── lib/
│   │   ├── api.ts          # 前端 API 客户端
│   │   └── admin-api.ts    # 管理后台 API 客户端
│   └── components/
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/         # API 路由（auth/body/garments/tryon/admin）
│   │   ├── core/           # 配置/数据库/安全
│   │   ├── models/         # SQLAlchemy 数据模型
│   │   ├── schemas/        # Pydantic 请求/响应模型
│   │   └── services/       # 业务逻辑（AI调用/试穿流程）
│   └── alembic/            # 数据库迁移
├── docs/                   # 技术文档
├── prisma/                 # Prisma schema（保留兼容）
└── docker-compose.yml
```

## 快速启动

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 配置后端环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入 API Key

# 3. 启动后端
cd backend
pip install -r requirements.txt
python init_admin.py
uvicorn app.main:app --reload --port 8000

# 4. 启动前端（新终端）
npm install
npm run dev
```

- 前端：http://localhost:3000
- 后端 API 文档：http://localhost:8000/docs
- 后台管理：http://localhost:3000/admin/login（admin / admin123）

详细部署说明见 [docs/部署指南.md](docs/部署指南.md)

## 核心功能

**用户端：**
- 注册/登录，体型数据录入（身高/围度/照片）
- 衣橱管理，AI 自动识别服装属性（品类/颜色/材质/版型）
- 虚拟试穿：选择服装 + 场景 + 姿势，AI 生成试穿效果图
- 尺码推荐：根据体型数据自动匹配最佳尺码
- 尺码对比：同一单品不同尺码的上身效果对比
- 质量自检：AI 自动评估生成质量，不合格自动重试
- 图片上传自动压缩（Pillow/sharp，转 webp 1024px）

**管理后台：**
- 系统概览：用户数/单品数/试穿统计
- 用户管理：列表/搜索/删除
- 试穿监控：任务列表/状态筛选/质量分/耗时

## 技术文档

- [技术实施方案](docs/虚拟试穿网站技术实施方案.md)
- [二期功能完善方案](docs/虚拟试穿二期-功能完善技术方案.md)
- [二期版型与姿态估计](docs/虚拟试穿二期-版型与姿态估计技术方案.md)
- [前后端分离方案](docs/前后端分离与后台管理技术方案.md)
- [部署指南](docs/部署指南.md)

## AI 模型配置

| 用途 | 模型 | 中转站 |
|------|------|--------|
| 服装识别/质量自检 | mimo-v2.5 | 小米 mimo |
| 虚拟试穿生图 | gpt-image-2pro | hfsyapi |

API 调用方式：
- 语言模型：OpenAI 兼容格式（chat/completions）
- 生图模型：支持 `reference_images` 参数传入参考图（最多4张）

## 许可证

私有项目
