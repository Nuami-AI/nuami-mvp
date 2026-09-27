import { BeusableRum } from "@/components/analytics/BeusableRum";
import { Hotjar } from "@/components/analytics/Hotjar";

function AppAnalytics() {
  return (
    <>
      <BeusableRum product="app" />
      <Hotjar />
    </>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    return (
      <>
        <AppAnalytics />
        {children}
      </>
    );
  }
  const { default: MobilePreviewFrame } = await import("@/components/dev/MobilePreviewFrame");
  return (
    <>
      <AppAnalytics />
      <MobilePreviewFrame>{children}</MobilePreviewFrame>
    </>
  );
}
