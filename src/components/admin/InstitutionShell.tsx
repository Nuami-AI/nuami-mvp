import { DashboardChrome, type DashboardNavGroup } from "@/components/admin/DashboardChrome";
import { hasOrgPermission, isSuperAdmin } from "@/lib/auth/access";
import { orgRoleLabel } from "@/lib/auth/roles";
import { formatContractPeriod } from "@/lib/datetime";
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
  const superAdmin = isSuperAdmin(email);
  const groups: DashboardNavGroup[] = [
    {
      label: "운영",
      items: [
        { href: base, label: "대시보드", icon: "dashboard", active: active === "dashboard" },
        ...(superAdmin
          ? [{ href: `${base}/logs`, label: "로그", icon: "logs" as const, active: active === "logs" }]
          : []),
      ],
    },
    {
      label: "자료",
      items: [
        { href: `${base}/content`, label: "콘텐츠", icon: "content", active: active === "content" },
        { href: `${base}/knowledge`, label: "안내 지식", icon: "knowledge", active: active === "knowledge" },
      ],
    },
    ...(showUsers || canMembers
      ? [
          {
            label: "구성원",
            items: [
              ...(showUsers
                ? [{ href: `${base}/users`, label: "사용자", icon: "users" as const, active: active === "users" }]
                : []),
              ...(canMembers
                ? [{ href: `${base}/members`, label: "멤버", icon: "members" as const, active: active === "members" }]
                : []),
            ],
          },
        ]
      : []),
  ];

  return (
    <DashboardChrome
      homeHref={base}
      brand={
        <span className="inline-flex items-center gap-2">
          <img
            src={institutionLogoSrc(institution.city, institution.logoFile ?? institution.id)}
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <span className="hidden h-7 max-w-[220px] truncate text-[22px] font-bold leading-7 text-text-primary sm:inline">
            {institution.nameKo}
          </span>
        </span>
      }
      email={email}
      roleLabel={membershipRole ? orgRoleLabel(membershipRole) : undefined}
      title={title}
      subtitle={subtitle}
      groups={groups}
      extraLinks={[{ href: "/admin", label: "기관 목록" }]}
      passwordHref="/admin/password"
      logoutAudience="admin"
      sidebarCaption={formatContractPeriod(institution.contractStart, institution.contractEnd)}
    >
      {children}
    </DashboardChrome>
  );
}
