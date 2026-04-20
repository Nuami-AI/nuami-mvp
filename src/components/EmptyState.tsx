// Design Ref: §2 — 빈 목록 상태 공통 컴포넌트.

interface Props {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
}

function DefaultIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="#A9A9A2" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9 12h6M9 16h6M7 4H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" />
      <rect x="7" y="2" width="10" height="4" rx="1" />
    </svg>
  );
}

export default function EmptyState({ icon, title, desc }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-12 h-12 rounded-full bg-infoBox flex items-center justify-center mb-3">
        {icon ?? <DefaultIcon />}
      </div>
      <p className="text-[14px] font-medium text-text-secondary">{title}</p>
      {desc && <p className="text-[12px] text-text-disabled mt-1">{desc}</p>}
    </div>
  );
}
