'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: '概览' },
  { href: '/admin/users', label: '用户管理' },
  { href: '/admin/tryon', label: '试穿监控' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 border-r bg-white p-4">
        <h2 className="mb-6 text-lg font-bold">管理后台</h2>
        <nav className="space-y-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={'block rounded-md px-3 py-2 text-sm ' + (pathname === n.href ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>{n.label}</Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
