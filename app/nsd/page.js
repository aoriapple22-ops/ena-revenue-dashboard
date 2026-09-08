import { fetchAll } from "@/lib/queries";
import { won, eok } from "@/lib/format";
import YearFilter from "@/components/YearFilter";

export const dynamic = "force-dynamic";

// 사업군은 연도마다 체계가 달라 데이터에서 뽑아 쓴다 (하드코딩 금지)
function categoriesOf(rows) {
  const order = ["건기식", "사업형·브랜디드", "용역사업", "커머스"];
  const found = [...new Set(rows.map((r) => r.category))];
  return [
    ...order.filter((c) => found.includes(c)),
    ...found.filter((c) => !order.includes(c)).sort(),
  ];
}

export default async function NsdPage({ searchParams }) {
  const year = Number(searchParams.year) || 2026;
  const { nsd, targets, error } = await fetchAll();
  if (error) return <p>데이터를 불러오지 못했습니다: {error.message}</p>;

  const rows = nsd.filter((r) => r.year === year);
  const cats = categoriesOf(rows);
  const isMonthly = rows.some((r) => r.month !== null);
  const bases = [...new Set(rows.map((r) => r.basis))];
  const allBases = [...new Set(nsd.map((r) => r.basis))];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const cell = (cat, month) =>
    rows
      .filter((r) => r.category === cat && (month === null || r.month === month))
      .reduce((s, r) => s + Number(r.amount), 0);

  const yearTotal = (y) =>
    nsd.filter((r) => r.year === y).reduce((s, r) => s + Number(r.amount), 0);

  const tgt = (cat) =>
    targets
      .filter(
        (t) =>
          t.year === year && t.team === "신사업개발팀" && t.metric === "매출" && t.item === cat
      )
      .reduce((s, t) => s + Number(t.value), 0);

  const grand = rows.reduce((s, r) => s + Number(r.amount), 0);
  const grandTgt = cats.reduce((s, c) => s + tgt(c), 0);
  const allYears = [...new Set(nsd.map((r) => r.year))].sort();

  return (
    <div>
      <h1>
        신사업개발팀 매출
        {bases.length === 1 && <span className="badge">{bases[0]} 기준</span>}
      </h1>
      <p className="subtitle">{cats.join(" / ") || "데이터 없음"}</p>

      <YearFilter basePath="/nsd" year={year} years={allYears} />

      {allBases.length > 1 && (
        <div className="note">
          <strong>연도별로 매출 기준이 다릅니다.</strong>{" "}
          {allYears
            .map((y) => {
              const b = [...new Set(nsd.filter((r) => r.year === y).map((r) => r.basis))];
              return `${y}년 ${b.join("·")}`;
            })
            .join(" · ")}
          <br />
          기준이 다르면 연도 간 단순 비교가 왜곡될 수 있습니다.
        </div>
      )}

      {!isMonthly && rows.length > 0 && (
        <div className="note">
          {year}년은 원본 자료에 <strong>연간 합계만</strong> 있어 월별 표시가 불가합니다.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card">
          <p>{year}년 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="card">
          <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>
            사업군별 {isMonthly ? "월별" : "연간"} 매출
          </h2>
          <table>
            <thead>
              <tr>
                <th className="l">사업군</th>
                {isMonthly && months.map((m) => <th key={m}>{m}월</th>)}
                <th>실적</th>
                <th>목표</th>
                <th>달성률</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((cat) => {
                const tot = cell(cat, null);
                const t = tgt(cat);
                const rate = t ? (tot / t) * 100 : null;
                return (
                  <tr key={cat}>
                    <td className="l">{cat}</td>
                    {isMonthly &&
                      months.map((m) => (
                        <td key={m}>{cell(cat, m) ? eok(cell(cat, m)) : "-"}</td>
                      ))}
                    <td>{tot ? won(tot) : "-"}</td>
                    <td>{t ? won(t) : "-"}</td>
                    <td className={rate === null ? "" : rate >= 100 ? "diff-up" : "diff-down"}>
                      {rate === null ? "-" : rate.toFixed(1) + "%"}
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td className="l">합계</td>
                {isMonthly &&
                  months.map((m) => {
                    const v = cats.reduce((s, c) => s + cell(c, m), 0);
                    return <td key={m}>{v ? eok(v) : "-"}</td>;
                  })}
                <td>{won(grand)}</td>
                <td>{grandTgt ? won(grandTgt) : "-"}</td>
                <td className={!grandTgt ? "" : grand / grandTgt >= 1 ? "diff-up" : "diff-down"}>
                  {grandTgt ? ((grand / grandTgt) * 100).toFixed(1) + "%" : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>연도별 합계</h2>
        <table>
          <thead>
            <tr>
              <th className="l">연도</th>
              <th className="l">기준</th>
              <th className="l">사업군 체계</th>
              <th>매출</th>
            </tr>
          </thead>
          <tbody>
            {allYears.map((y) => {
              const yr = nsd.filter((r) => r.year === y);
              return (
                <tr key={y}>
                  <td className="l">{y}년</td>
                  <td className="l">{[...new Set(yr.map((r) => r.basis))].join(", ")}</td>
                  <td className="l" style={{ color: "#6b7280", fontSize: 12 }}>
                    {categoriesOf(yr).join(" / ")}
                  </td>
                  <td>{won(yearTotal(y))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
