import { institutionLogoSrc, type InstitutionSeed } from "./catalog";

export interface CampusTheme {
  primary: string;
  onPrimary: string;
  soft: string;
  logoSrc: string;
}

const PRIMARY: Record<string, string> = {
  "korea-university": "#8B0029",
  "yonsei-university": "#003378",
  "seoul-national": "#003380",
  sungkyunkwan: "#00653A",
  hanyang: "#0E4D9E",
  sogang: "#B21F23",
  ewha: "#006B3D",
  kyunghee: "#9C1714",
  chungang: "#1A4F9C",
  hongik: "#1833DB",
  dongguk: "#E87722",
  konkuk: "#2E8B2A",
  kookmin: "#1B6B4A",
  soongsil: "#006694",
  sejong: "#C2072E",
  kwangwoon: "#6B2230",
  myongji: "#002968",
  sungshin: "#456D92",
  sangmyung: "#004896",
  duksung: "#981B45",
  dongduk: "#912642",
  "seoul-women": "#0C3388",
  sookmyung: "#003087",
  hansung: "#004098",
  "kaist-seoul": "#004294",
  seoultech: "#B4131D",
  uos: "#004094",
  catholic: "#0C2E86",
  "hankuk-foreign": "#002843",
  "korea-sports": "#296854",
  "seoul-edu": "#003994",
  seongkonghoe: "#5C2D6B",
  sahmyook: "#002C76",
  chongshin: "#1C2451",
  "seoul-christian": "#2B2E91",
  "seoul-hanyang": "#0066B5",
  chugye: "#E8470B",
  kyonggi: "#00A051",
  hoseo: "#2B59AB",
  "pusan-national": "#2056AE",
  "pukyong-national": "#15366F",
  bufs: "#1B365D",
  "dong-a": "#041E42",
  "donga-language": "#005EA8",
  dongseo: "#1E4B8C",
  dongmyung: "#3C6741",
  kyungsung: "#D80010",
  silla: "#436D2B",
  inje: "#8B1A1A",
  youngsan: "#EA5505",
  "busan-catholic": "#0E3F76",
  "busan-edu": "#007D3C",
  kosin: "#104C98",
  kmou: "#1E298B",
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function onPrimary(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1A1A1A" : "#FFFFFF";
}

function softTint(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

export function campusThemeOf(row: InstitutionSeed): CampusTheme {
  const primary = PRIMARY[row.id] ?? "#4B3F72";
  return {
    primary,
    onPrimary: onPrimary(primary),
    soft: softTint(primary),
    logoSrc: institutionLogoSrc(row.city, row.logoFile ?? row.id),
  };
}
