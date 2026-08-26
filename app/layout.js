import "./globals.css";

export const metadata = {
  title: "ENA 신성장센터 매출 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
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
        <main>{children}</main>
      </body>
    </html>
  );
}
