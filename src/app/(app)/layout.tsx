export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Dev-only mobile preview chrome — keep production layout as a server component.
  if (process.env.NODE_ENV === "production") {
    return children;
  }
  const { default: MobilePreviewFrame } = await import("@/components/dev/MobilePreviewFrame");
  return <MobilePreviewFrame>{children}</MobilePreviewFrame>;
}
