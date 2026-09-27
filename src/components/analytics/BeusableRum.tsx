const BEUSABLE_ID = {
  app: "b260927e125309u083",
  admin: "b260927e125309u083",
} as const;

/** Loads on every page, including /login. Picks app vs admin by host. */
export function BeusableRum() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(w, d){
    var host = (d.location.hostname || "").toLowerCase();
    var path = d.location.pathname || "";
    var id = null;
    if (host.indexOf("console.") === 0 || path.indexOf("/console") === 0) return;
    if (host.indexOf("admin.") === 0 || path.indexOf("/admin") === 0) id = "${BEUSABLE_ID.admin}";
    else id = "${BEUSABLE_ID.app}";
    if (!id) return;
    w.__beusablerumclient__ = {
        load : function(src){
            var b = d.createElement("script");
            b.src = src; b.async=true; b.type = "text/javascript";
            d.getElementsByTagName("head")[0].appendChild(b);
        }
    };w.__beusablerumclient__.load("//rum.beusable.net/load/" + id + "?url=" + encodeURIComponent(d.URL));
})(window, document);
`,
      }}
    />
  );
}
