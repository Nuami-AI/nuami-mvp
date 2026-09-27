import { BeusableRum } from "@/components/analytics/BeusableRum";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    return (
      <>
        <BeusableRum product="app" />
        {children}
      </>
    );
  }
  const { default: MobilePreviewFrame } = await import("@/components/dev/MobilePreviewFrame");
  return (
    <>
      <BeusableRum product="app" />
      <MobilePreviewFrame>{children}</MobilePreviewFrame>
    </>
  );
}
