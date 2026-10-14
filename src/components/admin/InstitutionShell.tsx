import Link from "next/link";

import { StatusBubble } from "@/components/ui/status-bubble";
import { hasOrgPermission } from "@/lib/auth/access";
import { orgRoleLabel } from "@/lib/auth/roles";
import {
  institutionAdminPath,
  institutionLogoSrc,
  type InstitutionSeed,
} from "@/lib/institution/catalog";

interface Props {
  email: string;
  institution: InstitutionSeed;
  membershipRole?: string;
  active: "dashboard" | "content" | "knowledge" | "logs" | "users" | "members";
  title: string;
  subtitle: string;
  showUsers?: boolean;
  children: React.ReactNode;
}

export default function InstitutionShell({
  email,
  institution,
  membershipRole,
  active,
  title,
  subtitle,
  showUsers = false,
  children,
}: Props) {
  const base = institutionAdminPath(institution);
  const canMembers = hasOrgPermission(membershipRole, "users.write");
  return (
    <div className="flex h-svh overflow-hidden bg-gray-50 text-sm">
      <aside className="flex h-full w-52 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href={base} className="inline-flex items-center gap-2.5">
            <img
              src={institutionLogoSrc(institution.city, institution.logoFile ?? institution.id)}
              alt={institution.nameKo}
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
            />
            <span className="min-w-0">
              <span className="block font-bold leading-tight text-gray-900">{institution.nameKo}</span>
              <span className="mt-0.5 block truncate text-[11px] text-gray-500" title={email}>
                {email}
              </span>
              {membershipRole ? (
                <span className="mt-1.5 block">
                  <StatusBubble tone="progress">{orgRoleLabel(membershipRole)}</StatusBubble>
                </span>
              ) : null}
            </span>
          </Link>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <SidebarItem href={base} label="대시보드" active={active === "dashboard"} />
          <SidebarItem href={`${base}/content`} label="콘텐츠" active={active === "content"} />
          <SidebarItem href={`${base}/knowledge`} label="안내 지식" active={active === "knowledge"} />
          <SidebarItem href={`${base}/logs`} label="로그" active={active === "logs"} />
          {showUsers ? (
            <SidebarItem href={`${base}/users`} label="사용자" active={active === "users"} />
          ) : null}
          {canMembers ? (
            <SidebarItem href={`${base}/members`} label="멤버" active={active === "members"} />
          ) : null}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[120px] shrink-0 flex-col justify-center border-b border-gray-200 bg-white px-8">
          <h1 className="truncate text-base font-bold text-gray-900">{title}</h1>
          <p className="mt-0.5 truncate text-gray-400">{subtitle}</p>
        </header>
        <main className="min-h-0 flex-1 overflow-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-lg px-3 py-2 transition-colors ${
        active
          ? "bg-gray-100 text-gray-900 font-medium"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}
