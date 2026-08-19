"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/login/LoginForm";

export default function EmailLoginPage() {
  return (
    <Suspense>
      <LoginForm audience="app" />
    </Suspense>
  );
}
