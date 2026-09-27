/** Raw tag so Hotjar/Contentsquare can see it in the first HTML, not after hydration. */
export function Hotjar() {
  return <script async src="https://t.contentsquare.net/uxa/d99c7038aa41c.js" />;
}
