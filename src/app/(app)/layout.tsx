import MobilePreviewFrame from "@/components/dev/MobilePreviewFrame";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <MobilePreviewFrame>{children}</MobilePreviewFrame>;
}
