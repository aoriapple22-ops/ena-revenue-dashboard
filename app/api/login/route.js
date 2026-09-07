import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE_SEC, checkPassword, createToken } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request) {
  let password = "";
  try {
    const body = await request.json();
    password = body?.password || "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!checkPassword(password)) {
    // 무차별 대입을 늦추기 위한 소폭 지연
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false, message: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: await createToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return res;
}
