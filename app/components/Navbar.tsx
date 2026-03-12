'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/projects" className="font-bold text-lg">
          my_pm
        </Link>
        <div className="flex gap-4 text-sm">
          <Link
            href="/projects"
            className={pathname === '/projects' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}
          >
            プロジェクト一覧
          </Link>
          <Link
            href="/projects/new"
            className={pathname === '/projects/new' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}
          >
            新規作成
          </Link>
        </div>
      </div>
    </nav>
  );
}
