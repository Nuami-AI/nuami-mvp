"use client";

import { AuthChrome, AuthTitle } from "@/components/login/AuthChrome";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function AdminPasswordPage() {
  return (
    <AuthChrome title="비밀번호 변경">
      <AuthTitle line1="비밀번호를" line2="바꿔 주세요." />
      <div className="mt-8">
        <ChangePasswordForm
          next="/admin"
          title=""
          description="현재 비밀번호를 확인한 뒤 8자 이상으로 바꿉니다."
        />
      </div>
    </AuthChrome>
  );
}
