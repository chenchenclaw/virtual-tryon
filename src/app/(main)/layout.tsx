'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/body', label: '体型档案', icon: '📏' },
  { href: '/wardrobe', label: '我的衣橱', icon: '👔' },
  { href: '/tryon', label: '虚拟试穿', icon: '✨' },
  { href: '/studio', label: '穿搭工坊', icon: '🎨' },
  { href: '/profile', label: '个人中心', icon: '👤' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/body" className="text-lg font-bold">AI 试穿</Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
