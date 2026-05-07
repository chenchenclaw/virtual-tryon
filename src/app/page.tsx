import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">AI 试穿</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              登录
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              免费注册
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            AI 智能虚拟试穿
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            上传你的照片和身材数据，选择喜欢的服装，AI 一键生成逼真的试穿效果图。
            自由搭配上衣、裤装、鞋履，找到最适合你的穿搭风格。
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              开始试穿
            </Link>
            <Link
              href="#features"
              className="rounded-md border px-6 py-3 text-base font-medium hover:bg-accent"
            >
              了解更多
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-4 py-16">
          <h2 className="mb-12 text-center text-3xl font-bold">核心功能</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: '体型档案',
                desc: '录入身高、围度等身材数据，AI 精准匹配你的身形比例',
                icon: '📏',
              },
              {
                title: '智能衣橱',
                desc: '上传服装照片，AI 自动识别品类、颜色、版型等属性',
                icon: '👔',
              },
              {
                title: 'AI 试穿',
                desc: '选择服装一键生成试穿效果，支持多件搭配和场景切换',
                icon: '✨',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border p-6 text-center">
                <div className="mb-4 text-4xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>AI 虚拟试穿平台 &copy; 2026</p>
      </footer>
    </div>
  );
}
