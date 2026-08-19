"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

const ICONS = {
  notifications: "/icons/header/notifications.svg",
  menu: "/icons/header/menu.svg",
  back: "/icons/header/back.svg",
  bookmark: "/icons/header/bookmark.svg",
  share: "/icons/header/share.svg",
} as const;

export type HeaderIconName = keyof typeof ICONS;

export function HeaderIcon({
  name,
  className,
  tintClassName,
}: {
  name: HeaderIconName;
  className?: string;
  tintClassName?: string;
}) {
  if (tintClassName) {
    return (
      <span
        aria-hidden
        className={cn("inline-block size-6 shrink-0", tintClassName, className)}
        style={{
          maskImage: `url("${ICONS[name]}")`,
          WebkitMaskImage: `url("${ICONS[name]}")`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "24px 24px",
          WebkitMaskSize: "24px 24px",
        }}
      />
    );
  }

  return (
    <img
      src={ICONS[name]}
      alt=""
      width={24}
      height={24}
      className={cn("size-6", className)}
    />
  );
}

export function HeaderIconButton({
  name,
  label,
  href,
  onClick,
  className,
  tintClassName,
}: {
  name: HeaderIconName;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  tintClassName?: string;
}) {
  const classNames = cn(
    "relative flex size-10 shrink-0 items-center justify-center rounded-lg",
    className,
  );
  const icon = <HeaderIcon name={name} tintClassName={tintClassName} />;

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classNames}>
        {icon}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={classNames}>
      {icon}
    </button>
  );
}
