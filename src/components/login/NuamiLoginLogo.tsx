import { BrandLogo } from "@/components/brand/BrandLogo";

export function NuamiLoginLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <BrandLogo variant="color" className="h-11" priority />
    </div>
  );
}
