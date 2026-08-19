import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { institutionAdminPath, type InstitutionSeed } from "@/lib/institution/catalog";

interface Props {
  email: string;
  institution: InstitutionSeed;
  active: "dashboard" | "content" | "knowledge" | "logs" | "users";
  title: string;
  subtitle: string;
  showUsers?: boolean;
  children: React.ReactNode;
}

export default function InstitutionShell({
  email,
  institution,
  active,
  title,
  subtitle,
  showUsers = false,
  children,
}: Props) {
  const base = institutionAdminPath(institution);
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-52 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href={base} className="inline-flex">
            <BrandLogo className="h-7" />
          </Link>
          <p className="mt-2 text-sm font-bold text-gray-900">{institution.nameKo}</p>
          <p className="mt-0.5 text-[10px] text-gray-400">기관 Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <SidebarItem href={base} label="대시보드" active={active === "dashboard"} />
          <SidebarItem href={`${base}/content`} label="콘텐츠" active={active === "content"} />
          <SidebarItem href={`${base}/knowledge`} label="안내 지식" active={active === "knowledge"} />
          <SidebarItem href={`${base}/logs`} label="로그" active={active === "logs"} />
          {showUsers ? (
            <SidebarItem href={`${base}/users`} label="사용자" active={active === "users"} />
          ) : null}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 truncate mb-2">{email}</p>
          <Link href="/admin/password" className="block text-xs text-gray-400 hover:text-gray-600 mb-2">
            비밀번호 변경
          </Link>
          <Link href="/admin" className="block text-xs text-gray-400 hover:text-gray-600 mb-2">
            기관 목록
          </Link>
          <form action="/api/auth/logout" method="POST">
            <input type="hidden" name="audience" value="admin" />
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="px-8 py-7">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-gray-100 text-gray-900 font-medium"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}
