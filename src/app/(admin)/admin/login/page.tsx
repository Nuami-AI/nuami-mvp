"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/login/LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm audience="admin" />
    </Suspense>
  );
}
