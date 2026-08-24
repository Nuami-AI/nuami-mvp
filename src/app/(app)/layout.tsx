import Script from "next/script";

const BEUSABLE_LOAD_URL = "//rum.beusable.net/load/b260824e143014u852";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let content: React.ReactNode = children;

  if (process.env.NODE_ENV !== "production") {
    const { default: MobilePreviewFrame } = await import("@/components/dev/MobilePreviewFrame");
    content = <MobilePreviewFrame>{children}</MobilePreviewFrame>;
  }

  return (
    <>
      {content}
      <Script id="beusable-rum" strategy="afterInteractive">
        {`(function(w, d, a){
    w.__beusablerumclient__ = {
        load : function(src){
            var b = d.createElement("script");
            b.src = src; b.async=true; b.type = "text/javascript";
            d.getElementsByTagName("head")[0].appendChild(b);
        }
    };w.__beusablerumclient__.load(a + "?url=" + encodeURIComponent(d.URL));
})(window, document, "${BEUSABLE_LOAD_URL}");`}
      </Script>
    </>
  );
}
