"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/login/LoginForm";

export default function ConsoleLoginPage() {
  return (
    <Suspense>
      <LoginForm audience="console" />
    </Suspense>
  );
}
