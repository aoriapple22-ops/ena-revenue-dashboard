"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 외부 사이트로의 리다이렉트를 막는다 (상대 경로만 허용)
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        router.replace(safeNext);
        router.refresh();
      } else {
        setError(data.message || "비밀번호가 올바르지 않습니다.");
        setPassword("");
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">ENA 신성장센터</div>
        <h1 className="login-title">매출 대시보드</h1>
        <p className="login-desc">
          사내 전용 자료입니다. 접속 비밀번호를 입력해 주세요.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          autoComplete="current-password"
          className="login-input"
        />

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-btn" disabled={busy || !password}>
          {busy ? "확인 중…" : "접속"}
        </button>

        <p className="login-foot">비밀번호는 센터 담당자에게 문의하세요.</p>
      </form>
    </div>
  );
}
