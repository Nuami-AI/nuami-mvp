import Script from "next/script";

export function Hotjar() {
  return (
    <Script
      src="https://t.contentsquare.net/uxa/d99c7038aa41c.js"
      strategy="afterInteractive"
    />
  );
}
