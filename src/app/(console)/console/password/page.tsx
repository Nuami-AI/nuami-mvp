"use client";

import { AuthChrome, AuthTitle } from "@/components/login/AuthChrome";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function ConsolePasswordPage() {
  return (
    <AuthChrome title="비밀번호 변경">
      <AuthTitle line1="비밀번호를" line2="바꿔 주세요." />
      <div className="mt-8">
        <ChangePasswordForm
          next="/console"
          title=""
          description="콘솔 계정 비밀번호를 8자 이상으로 바꿉니다."
        />
      </div>
    </AuthChrome>
  );
}
