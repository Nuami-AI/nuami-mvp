export interface UsageInfo {
  used: number | null;
  limit: number | null;
  remaining: number | null;
  role: "admin" | "tester" | null;
  daily?: boolean;
  plan?: "basic" | "plus" | "premium";
  resetsAt?: string | null;
}
