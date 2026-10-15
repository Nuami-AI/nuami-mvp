import { BrandLogo } from "@/components/brand/BrandLogo";
import { DashboardChrome, type DashboardNavGroup } from "@/components/admin/DashboardChrome";
import { isSuperAdmin } from "@/lib/auth/access";
import { getRequestClientIp } from "@/lib/request-ip";

type ConsoleNavId =
  | "users"
  | "logs"
  | "organizations"
  | "knowledge"
  | "providers"
  | "assets"
  | "opinions"
  | "opendata"
  | "llm"
  | "accounts"
  | "access";

interface Props {
  email: string;
  active: ConsoleNavId;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default async function AdminShell({ email, active, title, subtitle, actions, children }: Props) {
  const superAdmin = isSuperAdmin(email);
  const clientIp = await getRequestClientIp();
  const groups: DashboardNavGroup[] = [
    {
      label: "운영",
      items: [
        { href: "/console", label: "이용 현황", icon: "usage", active: active === "users" },
        ...(superAdmin
          ? [{ href: "/console/logs", label: "로그", icon: "logs" as const, active: active === "logs" }]
          : []),
        { href: "/console/opendata", label: "공공데이터 연동", icon: "opendata", active: active === "opendata" },
        { href: "/console/llm", label: "AI 사용량", icon: "llm", active: active === "llm" },
      ],
    },
    {
      label: "기관",
      items: [
        { href: "/console/organizations", label: "기관 목록", icon: "organizations", active: active === "organizations" },
        { href: "/console/knowledge", label: "기관 자료 검수", icon: "knowledge", active: active === "knowledge" },
      ],
    },
    {
      label: "지식베이스",
      items: [
        { href: "/console/providers", label: "자료 제공처", icon: "providers", active: active === "providers" },
        { href: "/console/assets", label: "지식자료", icon: "assets", active: active === "assets" },
        { href: "/console/opinions", label: "전문가 의견", icon: "opinions", active: active === "opinions" },
      ],
    },
    ...(superAdmin
      ? [
          {
            label: "계정",
            items: [
              { href: "/console/accounts", label: "전체 계정", icon: "accounts" as const, active: active === "accounts" },
              { href: "/console/access", label: "접속 제한", icon: "access" as const, active: active === "access" },
            ],
          },
        ]
      : []),
  ];

  return (
    <DashboardChrome
      homeHref="/console"
      brand={<BrandLogo className="h-7" />}
      email={email}
      roleLabel={superAdmin ? "슈퍼 어드민" : "콘솔 접근자"}
      roleTone={superAdmin ? "done" : "progress"}
      title={title}
      subtitle={subtitle}
      actions={actions}
      groups={groups}
      passwordHref="/console/password"
      logoutAudience="console"
      sidebarCaption={clientIp}
    >
      {children}
    </DashboardChrome>
  );
}
