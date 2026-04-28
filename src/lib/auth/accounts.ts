// Design Ref: §7 — hardcoded 3-account system via env vars
export interface Account {
  email: string;
  role: "admin" | "tester";
}

function getAccounts(): Array<Account & { password: string }> {
  return [
    {
      email: process.env.ADMIN_EMAIL ?? "",
      password: process.env.ADMIN_PASSWORD ?? "",
      role: "admin",
    },
    {
      email: process.env.TESTER1_EMAIL ?? "",
      password: process.env.TESTER1_PASSWORD ?? "",
      role: "tester",
    },
    {
      email: process.env.TESTER2_EMAIL ?? "",
      password: process.env.TESTER2_PASSWORD ?? "",
      role: "tester",
    },
    {
      email: process.env.TESTER3_EMAIL ?? "",
      password: process.env.TESTER3_PASSWORD ?? "",
      role: "tester",
    },
  ];
}

export function findAccount(email: string, password: string): Account | null {
  const accounts = getAccounts();
  const found = accounts.find(
    (a) => a.email && a.email === email && a.password === password
  );
  if (!found) return null;
  return { email: found.email, role: found.role };
}

export function getTesterEmails(): string[] {
  return [
    process.env.TESTER1_EMAIL ?? "",
    process.env.TESTER2_EMAIL ?? "",
    process.env.TESTER3_EMAIL ?? "",
  ].filter(Boolean);
}
