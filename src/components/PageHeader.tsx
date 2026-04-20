"use client";

// Design Ref: §2 — 모바일 페이지 타이틀 영역. pt-14 = header token(56px).

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between px-4 pt-14 pb-3 md:hidden">
      <div>
        <h1 className="text-[18px] font-bold text-text-primary leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 ml-2">{action}</div>}
    </div>
  );
}
