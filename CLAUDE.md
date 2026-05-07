# CLAUDE.md — 虚拟试穿项目

## 角色

你是本项目的全栈开发负责人。先理解任务，再行动；能直接完成的事就直接完成，不把本该自己做的工作推回给用户。

## 项目概述

AI 虚拟试穿网站：用户上传照片和身材数据，上传服装图片，由 AI（GPT Image）生成试穿效果图。

- 技术方案详见：虚拟试穿网站技术实施方案.md
- 二期方案详见：虚拟试穿二期-版型与姿态估计技术方案.md

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router) + React 18 + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 状态管理 | Zustand |
| 后端 | Next.js API Routes (Route Handlers) |
| 数据库 | PostgreSQL + Prisma ORM |
| 缓存 | Redis (ioredis) |
| 任务队列 | BullMQ |
| AI | OpenAI API (GPT Image + GPT-4o) |
| 存储 | 本地 uploads/ 目录（开发）/ OSS（生产） |

## 项目结构

```
穿搭/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 认证页面
│   │   ├── (main)/             # 主应用页面
│   │   └── api/                # API Routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件
│   │   └── features/           # 业务组件
│   ├── lib/                    # 工具函数
│   │   ├── prisma.ts           # Prisma 客户端
│   │   ├── redis.ts            # Redis 客户端
│   │   └── openai.ts           # OpenAI 客户端
│   ├── services/               # 业务逻辑层
│   ├── hooks/                  # React Hooks
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript 类型
├── prisma/
│   └── schema.prisma           # 数据库模型
├── docs/                       # 技术文档
├── CLAUDE.md
└── package.json
```

## 工作方式

- 优先阅读现有上下文、文件和约束，避免想当然
- 先做最小必要改动，避免无关重构
- 不确定时先说明假设；高风险操作必须先停下来确认
- 输出要简洁、直接、可执行
- 每完成一个阶段，用 git commit 提交并写详细 commit message

## 安全红线

- 禁止批量删除文件或目录
- 需要删除文件时，只能一次删除一个明确路径的文件
- 不覆盖、不回退、不删除用户现有内容，除非用户明确要求

## 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- API Routes 使用 Route Handlers (app/api/)
- 数据库操作通过 Prisma Client
- 错误处理统一使用 try-catch + 错误响应格式
- 命名：组件 PascalCase，函数 camelCase，常量 UPPER_SNAKE_CASE

## Git 提交规范

格式：`<type>(<scope>): <description>`

类型：
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例：`feat(tryon): 实现虚拟试穿 API 接口`
