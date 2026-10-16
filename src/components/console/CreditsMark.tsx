export function isUnlimitedCredits(account: {
  kind?: string;
  kinds?: string[];
  accountType?: string;
  isTest?: boolean;
}): boolean {
  return (
    account.isTest === true ||
    account.accountType === "INTERNAL" ||
    account.kind === "console" ||
    Boolean(account.kinds?.includes("console"))
  );
}

export function CreditsMark({
  used,
  limit,
  unlimited,
}: {
  used: number;
  limit: number;
  unlimited?: boolean;
}) {
  if (unlimited) {
    return (
      <span className="inline-flex items-center gap-1 tabular-nums text-violet-800" title="한도 없음 · 무한">
        <span className="text-gray-500">{used}/</span>
        <span className="font-semibold leading-none">∞</span>
        <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-800 ring-1 ring-violet-200">
          무한
        </span>
      </span>
    );
  }
  return (
    <span className="tabular-nums text-gray-700">
      {used}/{limit}
    </span>
  );
}
