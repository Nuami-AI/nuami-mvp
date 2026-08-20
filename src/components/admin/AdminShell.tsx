import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { StatusBubble } from "@/components/ui/status-bubble";
import { isSuperAdmin } from "@/lib/auth/access";

type ConsoleNavId = "users" | "logs" | "organizations" | "knowledge" | "operators" | "accounts";

interface Props {
  email: string;
  active: ConsoleNavId;
  title: string;
  subtitle: string;
  showOperators?: boolean;
  children: React.ReactNode;
}

export default function AdminShell({ email, active, title, subtitle, showOperators, children }: Props) {
  const superAdmin = isSuperAdmin(email);
  const operators = showOperators ?? superAdmin;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-52 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/console" className="inline-flex">
            <BrandLogo className="h-7" />
          </Link>
          <p className="mt-2 truncate text-sm font-bold text-gray-900" title={email}>
            {email}
          </p>
          <div className="mt-1.5">
            <StatusBubble tone={superAdmin ? "done" : "progress"}>
              {superAdmin ? "슈퍼 어드민" : "콘솔 접근자"}
            </StatusBubble>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4">
          <NavGroup label="운영">
            <SidebarItem href="/console" label="이용 현황" active={active === "users"} />
            <SidebarItem href="/console/logs" label="로그" active={active === "logs"} />
          </NavGroup>
          <NavGroup label="기관">
            <SidebarItem href="/console/organizations" label="기관 목록" active={active === "organizations"} />
            <SidebarItem href="/console/knowledge" label="자료 검수" active={active === "knowledge"} />
          </NavGroup>
          {operators ? (
            <NavGroup label="계정">
              <SidebarItem href="/console/accounts" label="전체 계정" active={active === "accounts"} />
              <SidebarItem href="/console/operators" label="콘솔 접근자" active={active === "operators"} />
            </NavGroup>
          ) : null}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <Link href="/console/password" className="block text-xs text-gray-400 hover:text-gray-600 mb-2">
            비밀번호 변경
          </Link>
          <form action="/api/auth/logout" method="POST">
            <input type="hidden" name="audience" value="console" />
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

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="space-y-0.5">{children}</div>
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
