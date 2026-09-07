import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "ENA 신성장센터 매출 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
