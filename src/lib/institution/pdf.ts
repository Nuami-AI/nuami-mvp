import { extractText, getDocumentProxy } from "unpdf";

const MAX_CHARS = 24_000;

export async function extractDocumentText(file: {
  name: string;
  type: string;
  buffer: Buffer;
}): Promise<string> {
  const lower = file.name.toLowerCase();
  const isPdf = file.type.includes("pdf") || lower.endsWith(".pdf");
  const isText =
    file.type.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md");

  if (isPdf) {
    const pdf = await getDocumentProxy(new Uint8Array(file.buffer));
    const result = await extractText(pdf, { mergePages: true });
    const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    return truncate(text.replace(/\u0000/g, " ").replace(/\s+\n/g, "\n").trim());
  }

  if (isText || !isPdf) {
    const text = file.buffer.toString("utf8").trim();
    if (text) return truncate(text);
  }

  throw new Error("PDF, TXT, MD 파일만 업로드할 수 있습니다.");
}

function truncate(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return `${text.slice(0, MAX_CHARS)}\n\n[문서가 길어 앞부분만 판독했습니다]`;
}
