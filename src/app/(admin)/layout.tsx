import { BeusableRum } from "@/components/analytics/BeusableRum";

export const metadata = {
  title: "NUAMI Institution Admin",
  description: "대학·기관 관리자 — 소속 기관 자료와 대시보드",
};

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BeusableRum product="admin" />
      {children}
    </>
  );
}
