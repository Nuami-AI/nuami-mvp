"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { NotFoundHero } from "@/components/admin/NotFoundHero";

export function AdminUnavailable({
  title = "죄송합니다. 현재 찾을 수 없는 페이지를 요청하셨어요.",
  description = "페이지 주소가 잘못되었거나, 주소가 바뀌거나 사라져서 찾을 수 없어요.",
}: {
  title?: string;
  description?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <NotFoundHero />
      <h1 className="mt-8 max-w-md text-[17px] font-bold leading-snug text-gray-900 sm:text-lg">
        {title}
      </h1>
      <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-gray-400">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 min-w-28 items-center justify-center rounded-full border border-accent-700 px-5 text-sm font-semibold text-accent-700 hover:bg-accent-50"
        >
          메인으로
        </Link>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 min-w-32 items-center justify-center rounded-full bg-accent-700 px-5 text-sm font-semibold text-white hover:bg-accent-800"
        >
          이전 페이지
        </button>
      </div>
    </div>
  );
}
