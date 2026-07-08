export function NuamiLoginLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`} aria-label="nuami">
      <div className="relative inline-block">
        <span
          className="absolute -top-[9px] left-[19px] flex gap-[3px]"
          aria-hidden
        >
          <span className="h-[7px] w-[7px] rounded-[1px] bg-brand-500" />
          <span className="h-[7px] w-[7px] rounded-[1px] bg-brand-500" />
        </span>
        <span className="text-[40px] font-bold leading-none tracking-[-0.02em] text-accent-700 lowercase">
          nuami
        </span>
      </div>
    </div>
  );
}
