"use client";

import { useRouter } from "next/navigation";

import { HeaderIconButton } from "@/components/ui/header-icon";

export function AuthChrome({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="min-h-dvh w-full bg-background text-text-primary">
      <div className="mx-auto flex min-h-dvh w-full max-w-[448px] flex-col">
        <header className="relative sticky top-0 z-10 flex h-16 items-center bg-white px-2">
          <HeaderIconButton
            name="back"
            label="뒤로"
            onClick={() => (onBack ? onBack() : router.back())}
          />
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[20px] font-semibold tracking-tight">
            {title}
          </h1>
        </header>
        <div className="flex flex-1 flex-col px-4 pb-8 pt-8">{children}</div>
      </div>
    </div>
  );
}

export function AuthTitle({ line1, line2 }: { line1: string; line2?: string }) {
  return (
    <h2 className="text-[24px] font-bold leading-[1.33] tracking-tight text-text-strong">
      {line1}
      {line2 ? (
        <>
          <br />
          {line2}
        </>
      ) : null}
    </h2>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-14 w-full rounded-lg border border-line-normal bg-white px-4 text-[16px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-700 ${props.className ?? ""}`}
    />
  );
}

export function AuthButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        backgroundColor: disabled ? "#D3D3CD" : "#8651F2",
        color: disabled ? "#8A8981" : "#ffffff",
      }}
      className={`h-12 w-full appearance-none rounded-lg text-[16px] font-semibold transition-colors ${
        disabled
          ? "bg-button-disabled text-text-tertiary opacity-50"
          : "bg-accent-700 text-white hover:bg-accent-800"
      }`}
    >
      {children}
    </button>
  );
}

export function AuthBottomBar({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[448px] bg-background">
      <AuthButton disabled={disabled} onClick={onClick}>
        {children}
      </AuthButton>
    </div>
  );
}
