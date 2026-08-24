export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    return children;
  }
  const { default: MobilePreviewFrame } = await import("@/components/dev/MobilePreviewFrame");
  return <MobilePreviewFrame>{children}</MobilePreviewFrame>;
}
