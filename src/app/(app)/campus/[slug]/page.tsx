"use client";

import CampusHome from "@/components/campus/CampusHome";
import { use } from "react";

export default function CampusSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <CampusHome slug={slug} />;
}
