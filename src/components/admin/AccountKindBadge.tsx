export type AccountKind = "org" | "end" | "console";

const KIND: Record<AccountKind, { label: string; className: string }> = {
  end: { label: "엔드유저", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  org: { label: "기관", className: "bg-slate-100 text-slate-800 ring-slate-200" },
  console: { label: "콘솔", className: "bg-violet-50 text-violet-800 ring-violet-200" },
};

export function AccountKindBadge({ kind }: { kind: AccountKind }) {
  const chip = KIND[kind];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${chip.className}`}>
      {chip.label}
    </span>
  );
}
