import type { ReactNode } from "react";

export type AdminNavIcon =
  | "usage"
  | "logs"
  | "opendata"
  | "llm"
  | "organizations"
  | "knowledge"
  | "providers"
  | "assets"
  | "opinions"
  | "accounts"
  | "access"
  | "dashboard"
  | "content"
  | "users"
  | "members";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export function AdminNavGlyph({ name }: { name: AdminNavIcon }) {
  switch (name) {
    case "usage":
    case "dashboard":
      return (
        <Icon>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </Icon>
      );
    case "logs":
      return (
        <Icon>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </Icon>
      );
    case "opendata":
      return (
        <Icon>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
          <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </Icon>
      );
    case "llm":
      return (
        <Icon>
          <path d="M12 3l1.4 4.2L18 8.6l-4.2 1.4L12 14l-1.4-4.2L6 8.6l4.6-1.4z" />
          <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
        </Icon>
      );
    case "organizations":
      return (
        <Icon>
          <path d="M4 20V8l8-4 8 4v12" />
          <path d="M9 20v-6h6v6" />
        </Icon>
      );
    case "knowledge":
      return (
        <Icon>
          <path d="M4 5h7a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V5z" />
          <path d="M20 5h-7a3 3 0 0 0-3 3v13h7a3 3 0 0 1 3 3V5z" />
        </Icon>
      );
    case "providers":
      return (
        <Icon>
          <path d="M3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </Icon>
      );
    case "assets":
    case "content":
      return (
        <Icon>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M14 3v6h6" />
        </Icon>
      );
    case "opinions":
      return (
        <Icon>
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0z" />
        </Icon>
      );
    case "accounts":
      return (
        <Icon>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M17 14c2.2.3 4 2 4 4.2" />
        </Icon>
      );
    case "access":
      return (
        <Icon>
          <path d="M12 3l8 4v6c0 5-3.4 7.8-8 9-4.6-1.2-8-4-8-9V7z" />
          <path d="M9.5 12.2l1.7 1.7 3.5-3.6" />
        </Icon>
      );
    case "users":
      return (
        <Icon>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
        </Icon>
      );
    case "members":
      return (
        <Icon>
          <circle cx="9" cy="8" r="3" />
          <path d="M4 20c0-2.8 2.2-5 5-5s5 2.2 5 5" />
          <rect x="14" y="11" width="7.5" height="10" rx="1.2" />
          <path d="M16 14.5h3.5M16 17.5h3.5" />
        </Icon>
      );
    default:
      return null;
  }
}
