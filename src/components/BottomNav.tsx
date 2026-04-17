"use client";

type TabId = "home" | "content" | "videoai" | "bookmark" | "mypage";

const TABS: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "content", label: "Content" },
  { id: "videoai", label: "Video AI" },
  { id: "bookmark", label: "Bookmarks" },
  { id: "mypage", label: "My Page" },
];

function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const stroke = active ? "#6D28D9" : "#9CA3AF";
  const fill = active ? "#6D28D9" : "none";

  if (id === "home")
    return (
      <svg width="20" height="20" fill={fill} stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="M9 21V12h6v9" fill="white" />
      </svg>
    );
  if (id === "content")
    return (
      <svg width="20" height="20" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  if (id === "videoai")
    return (
      <svg width="20" height="20" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="6" width="14" height="12" rx="2" fill={active ? "#EDE9FE" : "none"} stroke={stroke} />
        <path d="m16 10 5-3v10l-5-3V10z" fill={fill} stroke={stroke} />
      </svg>
    );
  if (id === "bookmark")
    return (
      <svg width="20" height="20" fill={fill} stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    );
  return (
    <svg width="20" height="20" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

export default function BottomNav({ active = "videoai" }: { active?: TabId }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-100 flex z-20">
      {TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            className={`flex-1 flex flex-col items-center pt-2 pb-3 gap-0.5 text-[10px] font-medium ${
              isActive ? "text-violet-700" : "text-gray-400"
            }`}
          >
            <TabIcon id={id} active={isActive} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
