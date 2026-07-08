"use client";

// Design Ref: §5.1 /login page — email + password form, JWT cookie issuance
// Figma: Nuami-0.25 node 44-517 (390×844 mobile)
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { NuamiLoginLogo } from "@/components/login/NuamiLoginLogo";

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { authenticated?: boolean }) => {
        if (data.authenticated) router.replace("/");
      })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Invalid email or password.");
        return;
      }
      const redirect = searchParams.get("redirect") ?? "/";
      router.push(redirect);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-white text-[#242422]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[390px] flex-col">
        {/* Header */}
        <header className="grid h-14 shrink-0 grid-cols-[40px_1fr_40px] items-center border-b border-[#E0E0E0] px-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-1 flex h-10 w-10 items-center justify-center text-[#242422]"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
          <h1 className="text-center text-[17px] font-medium text-[#3D3D3A]">Email Login</h1>
          <span aria-hidden />
        </header>

        <main className="flex flex-1 flex-col px-5 pb-8 pt-[72px]">
          <NuamiLoginLogo />

          <form onSubmit={handleSubmit} className="mt-[88px]">
            <div className="overflow-hidden rounded-[10px] border border-[#E0E0E0] bg-white">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full border-0 bg-transparent px-4 py-[15px] text-[15px] text-[#242422] placeholder:text-[#BDBDBD] focus:outline-none"
              />
              <div className="h-px bg-[#E0E0E0]" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border-0 bg-transparent px-4 py-[15px] text-[15px] text-[#242422] placeholder:text-[#BDBDBD] focus:outline-none"
              />
            </div>

            {error ? (
              <p className="mt-3 text-center text-[13px] text-danger">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-5 w-full rounded-[10px] py-[15px] text-[15px] font-semibold transition-colors ${
                canSubmit
                  ? "bg-accent-700 text-white hover:bg-accent-800"
                  : "cursor-not-allowed bg-[#E8E8E8] text-[#BDBDBD]"
              }`}
            >
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <button
            type="button"
            className="mt-6 text-center text-[14px] text-[#8A8981]"
            onClick={() => {}}
          >
            Forgot your password?
          </button>

          <div className="mt-auto pt-16 text-center">
            <p className="text-[14px] text-[#8A8981]">
              Don&apos;t have a NUAMI account yet?{" "}
              <span className="font-semibold text-accent-700">Sign Up</span>
            </p>
            <p className="mt-6 text-[11px] text-[#BDBDBD]">
              © 2025 NUAMI. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
