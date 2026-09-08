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

// 목표 항목명 -> 실적의 매출구분
const TARGET_ITEM_MAP = {
  기타매출: ["SNS", "네이버티비", "공동제작매출", "협찬PPL"],
  // 원본이 SMR/SNS 한 덩어리로 관리하므로 네이버티비를 함께 묶는다
  SNS: ["SNS", "네이버티비"],
};

export function targetItemTypes(item) {
  return TARGET_ITEM_MAP[item] || [item];
}

// 실적이 들어온 마지막 월. 안내 문구를 하드코딩하면 갱신 때마다 어긋나므로 데이터에서 구한다.
// 원본에 미래 월이 0으로 채워져 있는 경우가 있어 값이 0인 행은 제외한다.
export function latestActualMonth(rows, year) {
  const ms = rows
    .filter((r) => {
      if (r.year !== year || r.actual_type !== "실적" || !r.month) return false;
      const v =
        Number(r.views || 0) +
        Number(r.gross_revenue || 0) +
        Number(r.subscribers || 0) +
        Number(r.amount || 0);
      return v !== 0;
    })
    .map((r) => r.month);
  return ms.length ? Math.max(...ms) : null;
}

// 목표가 설정된 매출구분만 골라 실적을 집계한다.
// (목표 범위와 실적 범위가 다르면 달성률이 왜곡되므로)
export function digitalActualForTargets(digital, targets, year, team = "디지털사업팀") {
  const items = [
    ...new Set(
      targets
        .filter((t) => t.year === year && t.team === team && t.metric === "매출")
        .map((t) => t.item)
    ),
  ];
  if (items.length === 0) return { actual: 0, covered: [], items: [] };
  const covered = [...new Set(items.flatMap(targetItemTypes))];
  const actual = digital
    .filter((r) => r.year === year && covered.includes(r.revenue_type))
    .reduce((s, r) => s + netRevenue(r), 0);
  return { actual, covered, items };
}
