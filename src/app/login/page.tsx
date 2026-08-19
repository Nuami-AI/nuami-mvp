import { Suspense } from "react";

import { SocialLoginHome } from "@/components/login/SocialLoginHome";
import { configuredProviders } from "@/lib/auth/oauth";

export default function LoginPage() {
  return (
    <Suspense>
      <SocialLoginHome configured={configuredProviders()} />
    </Suspense>
  );
}
