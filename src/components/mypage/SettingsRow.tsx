"use client";

import Link from "next/link";

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-disabled" aria-hidden>
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsRow({
  href,
  label,
  value,
  onClick,
  danger = false,
}: {
  href?: string;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <>
      <span className={`min-w-0 truncate text-[15px] ${danger ? "text-danger-800" : "text-text-primary"}`}>{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        {value ? <span className="max-w-40 truncate text-[13px] text-text-tertiary">{value}</span> : null}
        <Chevron />
      </span>
    </>
  );

  const className = "flex w-full items-center justify-between gap-3 px-4 py-4 text-left active:bg-muted";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-line-normal bg-white">{children}</div>;
}
