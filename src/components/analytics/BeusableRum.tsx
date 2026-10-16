/** 뷰저블 대시보드에 등록된 프로젝트. */
const BEUSABLE_LOAD_URL = "//rum.beusable.net/load/b260927e125309u083";

/** Loads on every page, including /login. Console is skipped. */
export function BeusableRum() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(w, d, a){
    var host = (d.location.hostname || "").toLowerCase();
    var path = d.location.pathname || "";
    if (host.indexOf("console.") === 0 || path.indexOf("/console") === 0) return;
    w.__beusablerumclient__ = {
        load : function(src){
            var b = d.createElement("script");
            b.src = src; b.async=true; b.type = "text/javascript";
            d.getElementsByTagName("head")[0].appendChild(b);
        }
    };w.__beusablerumclient__.load(a + "?url=" + encodeURIComponent(d.URL));
})(window, document, "${BEUSABLE_LOAD_URL}");
`,
      }}
    />
  );
}
