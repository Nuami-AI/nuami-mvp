const BEUSABLE_ID = {
  app: "b260927e125309u083",
  admin: "b260927e125309u083",
} as const;

type BeusableProduct = keyof typeof BEUSABLE_ID;

/** One Beusable project per product. Never loads app + admin on the same page. */
export function BeusableRum({ product }: { product: BeusableProduct }) {
  const id = BEUSABLE_ID[product];
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(w, d, a, product){
    var host = (d.location.hostname || "").toLowerCase();
    if (host.indexOf("console.") === 0) return;
    if (product === "app" && host.indexOf("admin.") === 0) return;
    if (product === "admin" && host.indexOf("app.") === 0) return;
    w.__beusablerumclient__ = {
        load : function(src){
            var b = d.createElement("script");
            b.src = src; b.async=true; b.type = "text/javascript";
            d.getElementsByTagName("head")[0].appendChild(b);
        }
    };w.__beusablerumclient__.load(a + "?url=" + encodeURIComponent(d.URL));
})(window, document, "//rum.beusable.net/load/${id}", "${product}");
`,
      }}
    />
  );
}
