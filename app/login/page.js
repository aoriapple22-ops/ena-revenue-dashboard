import LoginForm from "./LoginForm";

export const metadata = { title: "로그인 · ENA 신성장센터 매출 대시보드" };

export default function LoginPage({ searchParams }) {
  const next = typeof searchParams?.next === "string" ? searchParams.next : "/";
  return <LoginForm next={next} />;
}
