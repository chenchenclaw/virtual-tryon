'use client';

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">个人中心</h1>

      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">基本信息</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">头像</span>
              <div className="h-12 w-12 rounded-full bg-muted" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">昵称</span>
              <span className="text-sm">-</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">邮箱</span>
              <span className="text-sm">-</span>
            </div>
          </div>
        </div>

        {/* 使用统计 */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">使用统计</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground">试穿次数</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground">衣橱单品</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground">穿搭方案</div>
            </div>
          </div>
        </div>

        {/* 操作 */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">账号操作</h2>
          <div className="space-y-2">
            <button className="w-full rounded-md border py-2 text-sm hover:bg-accent">
              修改密码
            </button>
            <button className="w-full rounded-md border py-2 text-sm text-destructive hover:bg-destructive/10">
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
