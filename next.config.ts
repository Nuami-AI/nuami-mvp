import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 시연/녹화용 — Next.js Dev Tools 배지(좌하단 N) 임시 숨김. 끝나면 false 제거.
  devIndicators: false,
  // LAN 폰에서 /_next JS가 403 나면 onClick 버튼이 전부 죽은 것처럼 보임.
  // 하단 네비만 <a>라서 동작함. 변경 후 dev 서버 재시작 필요.
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.local",
    "127.0.0.1",
  ],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb"],
  turbopack: {},
};

export default nextConfig;
