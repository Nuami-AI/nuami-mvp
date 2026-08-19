import { cn } from "@/lib/utils";

type LogoVariant = "black" | "color";

const SRC: Record<LogoVariant, string> = {
  black: "/brand/nuami-logo-black.svg",
  color: "/brand/nuami-logo-color.svg",
};

interface Props {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ variant = "black", className, priority = false }: Props) {
  return (
    <img
      src={SRC[variant]}
      alt="nüami"
      width={400}
      height={110}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn("h-7 w-auto", className)}
    />
  );
}
