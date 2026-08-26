import { getSupabase } from "./supabaseClient";

// 한 번에 전부 읽어와 서버에서 집계한다 (전체 605행 규모라 부담 없음)
export async function fetchAll() {
  const sb = getSupabase();
  const [nsd, digital, program, targets] = await Promise.all([
    sb.from("nsd_revenue").select("*"),
    sb.from("digital_channel").select("*"),
    sb.from("program_ena").select("*"),
    sb.from("targets").select("*"),
  ]);
  return {
    nsd: nsd.data || [],
    digital: digital.data || [],
    program: program.data || [],
    targets: targets.data || [],
    error: nsd.error || digital.error || program.error || targets.error,
  };
}

export function sumBy(rows, keyFn, valFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k === null || k === undefined) continue;
    map.set(k, (map.get(k) || 0) + (Number(valFn(r)) || 0));
  }
  return map;
}

// 연도별 신사업 매출 합계
export function nsdByYear(rows) {
  return sumBy(rows, (r) => r.year, (r) => r.amount);
}

// 디지털 순매출 = 총매출 + 배분액
export function netRevenue(r) {
  return (Number(r.gross_revenue) || 0) + (Number(r.share_amount) || 0);
}
