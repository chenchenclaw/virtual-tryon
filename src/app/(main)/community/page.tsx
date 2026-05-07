'use client';

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">社区广场</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        发现时尚灵感，分享你的穿搭方案
      </p>

      <div className="rounded-lg border p-8 text-center">
        <div className="mb-4 text-4xl">👗</div>
        <h3 className="mb-2 text-lg font-semibold">社区功能即将上线</h3>
        <p className="text-sm text-muted-foreground">
          穿搭分享、点赞互动、穿搭挑战等功能正在开发中，敬请期待
        </p>
      </div>
    </div>
  );
}
