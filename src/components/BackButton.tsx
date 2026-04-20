// Design Ref: §2 — 뒤로가기 버튼 공통 컴포넌트.

import Link from "next/link";

interface Props {
  href: string;
  label?: string;
}

export default function BackButton({ href, label = "뒤로가기" }: Props) {
  return (
    <Link
      href={href}
      className="w-8 h-8 rounded-full bg-infoBox flex items-center justify-center flex-shrink-0 hover:bg-muted transition-colors"
      aria-label={label}
    >
      <svg width="16" height="16" fill="none" stroke="#575652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}
