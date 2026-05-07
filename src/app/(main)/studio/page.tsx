'use client';

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">穿搭工坊</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        AI 根据你的身材数据和风格偏好，推荐最适合你的穿搭方案
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI 推荐 */}
        <div className="rounded-lg border p-6">
          <div className="mb-4 text-3xl">🎯</div>
          <h3 className="mb-2 text-lg font-semibold">智能推荐</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            根据你的体型数据和风格偏好，AI 自动推荐整套穿搭方案
          </p>
          <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            获取推荐
          </button>
        </div>

        {/* 场景穿搭 */}
        <div className="rounded-lg border p-6">
          <div className="mb-4 text-3xl">🎬</div>
          <h3 className="mb-2 text-lg font-semibold">场景穿搭</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            通勤、约会、运动、正式...选择场景获得专属搭配建议
          </p>
          <button className="w-full rounded-md border py-2 text-sm font-medium hover:bg-accent">
            选择场景
          </button>
        </div>

        {/* 色彩搭配 */}
        <div className="rounded-lg border p-6">
          <div className="mb-4 text-3xl">🎨</div>
          <h3 className="mb-2 text-lg font-semibold">色彩搭配</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            根据肤色推荐适合的配色方案，让穿搭更协调
          </p>
          <button className="w-full rounded-md border py-2 text-sm font-medium hover:bg-accent">
            色彩分析
          </button>
        </div>

        {/* 穿搭评分 */}
        <div className="rounded-lg border p-6">
          <div className="mb-4 text-3xl">⭐</div>
          <h3 className="mb-2 text-lg font-semibold">穿搭评分</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            上传你的穿搭方案，AI 从协调度、风格感等维度打分
          </p>
          <button className="w-full rounded-md border py-2 text-sm font-medium hover:bg-accent">
            开始评分
          </button>
        </div>
      </div>
    </div>
  );
}
