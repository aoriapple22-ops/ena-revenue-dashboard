import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// Supabase 무료 플랜은 일정 기간 요청이 없으면 프로젝트를 자동 중지한다.
// Vercel Cron(vercel.json)이 주기적으로 이 경로를 호출해 DB를 깨워 둔다.
// 데이터는 응답에 담지 않는다 (인증 없이 호출되는 경로이므로).
export async function GET(request) {
  // CRON_SECRET이 설정돼 있으면 Vercel Cron이 보내는 Bearer 토큰을 검증한다
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { error } = await getSupabase()
    .from("targets")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
