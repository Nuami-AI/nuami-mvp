const GA_ID = {
  app: "G-125RNVHY0S",
  admin: "G-646YJZSXKR",
  console: "G-Z13G70BRKD",
} as const;

/** One GA property per product. */
export function GoogleAnalytics() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(w, d){
    var host = (d.location.hostname || "").toLowerCase();
    var path = d.location.pathname || "";
    var id = "${GA_ID.app}";
    if (host.indexOf("console.") === 0 || path.indexOf("/console") === 0) {
        id = "${GA_ID.console}";
    } else if (host.indexOf("admin.") === 0 || path.indexOf("/admin") === 0) {
        id = "${GA_ID.admin}";
    }
    var s = d.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
    d.getElementsByTagName("head")[0].appendChild(s);
    w.dataLayer = w.dataLayer || [];
    function gtag(){w.dataLayer.push(arguments);}
    w.gtag = gtag;
    gtag("js", new Date());
    gtag("config", id);
})(window, document);
`,
      }}
    />
  );
}
