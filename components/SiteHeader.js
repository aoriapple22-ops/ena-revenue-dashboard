"use client";

import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="site">
      <span className="brand">ENA 신성장센터</span>
      <nav>
        <a href="/">요약</a>
        <a href="/nsd">신사업개발팀 매출</a>
        <a href="/digital">디지털 채널별</a>
        <a href="/program">프로그램별</a>
        <a href="/target">목표 대비 달성률</a>
      </nav>
    </header>
  );
}
