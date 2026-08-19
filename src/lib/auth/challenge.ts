import { prisma } from "@/lib/db";
import {
  challengeExpiry,
  exposeDevCodes,
  generateCode,
  hashCode,
} from "@/lib/auth/password";

export type ChallengePurpose = "signup" | "reset";

export async function issueChallenge(email: string, purpose: ChallengePurpose) {
  const normalized = email.toLowerCase();
  const code = generateCode();
  const codeHash = hashCode(normalized, purpose, code);
  await prisma.authChallenge.updateMany({
    where: { email: normalized, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.authChallenge.create({
    data: {
      email: normalized,
      purpose,
      codeHash,
      expiresAt: challengeExpiry(),
    },
  });
  return { code: exposeDevCodes() ? code : undefined };
}

export async function verifyChallenge(email: string, purpose: ChallengePurpose, code: string) {
  const normalized = email.toLowerCase();
  const codeHash = hashCode(normalized, purpose, code.trim());
  const row = await prisma.authChallenge.findFirst({
    where: {
      email: normalized,
      purpose,
      codeHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return Boolean(row);
}

export async function consumeChallenge(email: string, purpose: ChallengePurpose, code: string) {
  const normalized = email.toLowerCase();
  const codeHash = hashCode(normalized, purpose, code.trim());
  const row = await prisma.authChallenge.findFirst({
    where: {
      email: normalized,
      purpose,
      codeHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;
  await prisma.authChallenge.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return true;
}
