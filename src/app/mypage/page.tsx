import PageShell from "@/components/PageShell";
import LanguageSelector from "./LanguageSelector";
import MypageHeader from "./MypageHeader";

export default function MypagePage() {
  return (
    <PageShell topNav="content" bottomNav="mypage">
      <MypageHeader />
      <LanguageSelector />
    </PageShell>
  );
}
