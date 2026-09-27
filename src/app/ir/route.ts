import { NextResponse } from "next/server";

/** Public shortlink: https://app.nuami.kr/ir */
const IR_DECK_URL =
  "https://acrobat.adobe.com/id/urn:aaid:sc:AP:22c7698d-2c70-468b-a49d-da25ab5be37d";

export function GET() {
  return NextResponse.redirect(IR_DECK_URL, 307);
}
