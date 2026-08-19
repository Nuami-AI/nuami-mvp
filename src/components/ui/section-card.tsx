import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon: string;
  title: string;
  accent?: "purple" | "blue" | "green" | "amber";
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ icon, title, children, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-2xl border-2 border-line-neutral shadow-sm overflow-hidden", className)}>
      <div className="border-l-4 border-l-gray-800 bg-white px-4 py-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="text-[15px] font-bold text-text-primary">{title}</h3>
      </div>
      <div className="border-t-2 border-line-neutral">{children}</div>
    </section>
  );
}
