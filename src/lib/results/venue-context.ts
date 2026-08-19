export type ResultVenue = "store" | "bank" | "hospital" | "immigration" | "default";

export function detectResultVenue(situation: string): ResultVenue {
  const s = situation.toLowerCase();
  if (/쇼핑|올리브영|올영|매장|드럭스토어|화장품|뷰티|k-?beauty|olive|shopping|cosmetic|ショッピング|オリーブ|오프라인|준비사항|제품|세일|할인/.test(s)) {
    return "store";
  }
  if (/체류지|전입|이사|주소\s*변경|residence|address change|引っ越し|転入|chuyển nhà|đổi địa chỉ|搬家|地址/.test(s)) {
    return "immigration";
  }
  if (/은행|계좌|bank|account|銀行|口座/.test(s)) return "bank";
  if (/병원|약국|hospital|clinic|pharmacy|病院|薬局/.test(s)) return "hospital";
  return "default";
}

export function isShoppingContext(venue: ResultVenue, productCount: number): boolean {
  return venue === "store" || productCount > 0;
}
