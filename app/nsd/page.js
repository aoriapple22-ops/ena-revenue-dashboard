import { fetchAll } from "@/lib/queries";
import { won, eok, pct, rateClass, periodLabel } from "@/lib/format";
import YearFilter from "@/components/YearFilter";

export const dynamic = "force-dynamic";

const CATEGORIES = ["건기식", "브랜디드", "기타사업(협찬)", "커머스"];

export default async function NsdPage({ searchParams }) {
  const year = Number(searchParams.year) || 2025;
  const { nsd, error } = await fetchAll();
  if (error) return <p>데이터를 불러오지 못했습니다: {error.message}</p>;

  const rows = nsd.filter((r) => r.year === year);
  const isMonthly = rows.some((r) => r.month !== null);

  const cell = (cat, month) =>
    rows
      .filter((r) => r.category === cat && (month === null || r.month === month))
      .reduce((s, r) => s + Number(r.amount), 0);

  const catTotal = (cat) =>
    rows.filter((r) => r.category === cat).reduce((s, r) => s + Number(r.amount), 0);

  const prevTotal = (cat) =>
    nsd.filter((r) => r.year === year - 1 && r.category === cat)
      .reduce((s, r) => s + Number(r.amount), 0);

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const grand = rows.reduce((s, r) => s + Number(r.amount), 0);
  const estMonths = new Set(rows.filter((r) => r.actual_type === "추정").map((r) => r.month));

  return (
    <div>
      <h1>신사업개발팀 매출</h1>
      <p className="subtitle">
        계약 기준 · 건기식 / 브랜디드 / 기타사업(협찬) / 커머스
      </p>

      <YearFilter basePath="/nsd" year={year} years={[2024, 2025, 2026]} />

      {!isMonthly && (
        <div className="note">
          {year}년은 원본 자료에 <strong>연간 합계만</strong> 있어 월별 표시가 불가합니다.
          월별은 2025년만 제공됩니다.
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>
          사업군별 {isMonthly ? "월별" : "연간"} 매출
        </h2>
        <table>
          <thead>
            <tr>
              <th className="l">사업군</th>
              {isMonthly &&
                months.map((m) => (
                  <th key={m}>
                    {m}월{estMonths.has(m) && <span className="est">추정</span>}
                  </th>
                ))}
              <th>합계</th>
              <th>전년</th>
              <th>전년비</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const tot = catTotal(cat);
              const prev = prevTotal(cat);
              const growth = prev ? ((tot - prev) / prev) * 100 : null;
              return (
                <tr key={cat}>
                  <td className="l">{cat}</td>
                  {isMonthly &&
                    months.map((m) => <td key={m}>{cell(cat, m) ? eok(cell(cat, m)) : "-"}</td>)}
                  <td>{tot ? won(tot) : "-"}</td>
                  <td>{prev ? won(prev) : "-"}</td>
                  <td className={growth === null ? "" : growth >= 0 ? "diff-up" : "diff-down"}>
                    {growth === null ? "-" : (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%"}
                  </td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td className="l">합계</td>
              {isMonthly &&
                months.map((m) => {
                  const v = CATEGORIES.reduce((s, c) => s + cell(c, m), 0);
                  return <td key={m}>{v ? eok(v) : "-"}</td>;
                })}
              <td>{won(grand)}</td>
              <td>
                {won(
                  nsd.filter((r) => r.year === year - 1).reduce((s, r) => s + Number(r.amount), 0)
                )}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>연도별 추이</h2>
        <table>
          <thead>
            <tr>
              <th className="l">사업군</th>
              <th>2024년</th>
              <th>2025년</th>
              <th>2026년</th>
              <th>25 → 26</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const v = (y) =>
                nsd.filter((r) => r.year === y && r.category === cat)
                  .reduce((s, r) => s + Number(r.amount), 0);
              const g = v(2025) ? ((v(2026) - v(2025)) / v(2025)) * 100 : null;
              return (
                <tr key={cat}>
                  <td className="l">{cat}</td>
                  <td>{v(2024) ? won(v(2024)) : "-"}</td>
                  <td>{v(2025) ? won(v(2025)) : "-"}</td>
                  <td>{v(2026) ? won(v(2026)) : "-"}</td>
                  <td className={g === null ? "" : g >= 0 ? "diff-up" : "diff-down"}>
                    {g === null ? "-" : (g >= 0 ? "+" : "") + g.toFixed(1) + "%"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
