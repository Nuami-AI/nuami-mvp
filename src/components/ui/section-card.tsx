import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon: string;
  title: string;
  accent?: "purple" | "blue" | "green" | "amber";
  children: React.ReactNode;
  className?: string;
}

const ACCENT = {
  purple: "border-l-accent-700 bg-white",
  blue: "border-l-blue-600 bg-white",
  green: "border-l-emerald-600 bg-white",
  amber: "border-l-amber-500 bg-white",
} as const;

export function SectionCard({ icon, title, accent = "purple", children, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-2xl border-2 border-line-neutral shadow-sm overflow-hidden", className)}>
      <div className={cn("border-l-4 px-4 py-3 flex items-center gap-2", ACCENT[accent])}>
        <span className="text-lg">{icon}</span>
        <h3 className="text-[15px] font-bold text-text-primary">{title}</h3>
      </div>
      <div className="border-t-2 border-line-neutral">{children}</div>
    </section>
  );
}
