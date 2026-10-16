/** Raw tag so Hotjar/Contentsquare can see it in the first HTML, not after hydration. */
export function Hotjar() {
  return <script defer src="https://t.contentsquare.net/uxa/17a7a7a444cfd.js" />;
}
