import { fetchAll, netRevenue } from "@/lib/queries";
import { won, num, eok } from "@/lib/format";
import YearFilter from "@/components/YearFilter";

export const dynamic = "force-dynamic";

export default async function DigitalPage({ searchParams }) {
  const year = Number(searchParams.year) || 2025;
  const view = searchParams.view || "channel";
  const { digital, error } = await fetchAll();
  if (error) return <p>데이터를 불러오지 못했습니다: {error.message}</p>;

  const rows = digital.filter((r) => r.year === year);
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const channels = [...new Set(rows.map((r) => r.channel))].filter((c) => c !== "해당없음");
  const revTypes = [...new Set(rows.map((r) => r.revenue_type))];

  const agg = (filter) => {
    const f = rows.filter(filter);
    return {
      views: f.reduce((s, r) => s + (Number(r.views) || 0), 0),
      subs: f.reduce((s, r) => s + (Number(r.subscribers) || 0), 0),
      gross: f.reduce((s, r) => s + (Number(r.gross_revenue) || 0), 0),
      share: f.reduce((s, r) => s + (Number(r.share_amount) || 0), 0),
      net: f.reduce((s, r) => s + netRevenue(r), 0),
    };
  };

  const total = agg(() => true);
  const estimated = rows.some((r) => r.actual_type === "추정");

  return (
    <div>
      <h1>디지털사업팀 채널별 실적</h1>
      <p className="subtitle">
        조회수 · 구독자 증감 · 총매출 · 배분액 · 순매출 (순매출 = 총매출 + 배분액)
      </p>

      <YearFilter
        basePath="/digital"
        year={year}
        years={[2024, 2025]}
        extra={[
          {
            key: "view",
            label: "보기",
            value: view,
            options: [
              { value: "channel", label: "채널별" },
              { value: "month", label: "월별 (통합)" },
              { value: "type", label: "매출구분별" },
            ],
          },
        ]}
      />

      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">총매출</div>
          <div className="value">{eok(total.gross)}</div>
        </div>
        <div className="kpi">
          <div className="label">배분액</div>
          <div className="value">{total.share ? eok(total.share) : "-"}</div>
        </div>
        <div className="kpi">
          <div className="label">순매출</div>
          <div className="value">{eok(total.net)}</div>
        </div>
        <div className="kpi">
          <div className="label">조회수</div>
          <div className="value">{num(total.views)}</div>
          <div className="sub">구독자 증감 {num(total.subs)}</div>
        </div>
      </div>

      {estimated && (
        <div className="note">
          {year}년 <strong>12월은 추정치</strong>입니다 (원본 자료 기준 11월까지 실적).
        </div>
      )}

      <div className="card">
        {view === "channel" && (
          <>
            <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>채널별 (유튜브)</h2>
            <table>
              <thead>
                <tr>
                  <th className="l">채널</th>
                  <th>조회수</th>
                  <th>구독자 증감</th>
                  <th>총매출</th>
                </tr>
              </thead>
              <tbody>
                {channels
                  .map((c) => ({ c, a: agg((r) => r.channel === c) }))
                  .sort((x, y) => y.a.gross - x.a.gross)
                  .map(({ c, a }) => (
                    <tr key={c}>
                      <td className="l">{c}</td>
                      <td>{a.views ? num(a.views) : "-"}</td>
                      <td>{a.subs ? num(a.subs) : "-"}</td>
                      <td>{a.gross ? won(a.gross) : "-"}</td>
                    </tr>
                  ))}
                <tr className="total-row">
                  <td className="l">채널 합계</td>
                  <td>{num(total.views)}</td>
                  <td>{num(total.subs)}</td>
                  <td>
                    {won(
                      channels.reduce((s, c) => s + agg((r) => r.channel === c).gross, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {view === "month" && (
          <>
            <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>월별 통합</h2>
            <table>
              <thead>
                <tr>
                  <th className="l">월</th>
                  <th>조회수</th>
                  <th>구독자 증감</th>
                  <th>총매출</th>
                  <th>배분액</th>
                  <th>순매출</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => {
                  const a = agg((r) => r.month === m);
                  const est = rows.some((r) => r.month === m && r.actual_type === "추정");
                  return (
                    <tr key={m}>
                      <td className="l">
                        {m}월{est && <span className="est">추정</span>}
                      </td>
                      <td>{a.views ? num(a.views) : "-"}</td>
                      <td>{a.subs ? num(a.subs) : "-"}</td>
                      <td>{a.gross ? won(a.gross) : "-"}</td>
                      <td>{a.share ? won(a.share) : "-"}</td>
                      <td>{a.net ? won(a.net) : "-"}</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td className="l">합계</td>
                  <td>{num(total.views)}</td>
                  <td>{num(total.subs)}</td>
                  <td>{won(total.gross)}</td>
                  <td>{total.share ? won(total.share) : "-"}</td>
                  <td>{won(total.net)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {view === "type" && (
          <>
            <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>매출구분별</h2>
            <table>
              <thead>
                <tr>
                  <th className="l">매출구분</th>
                  <th>총매출</th>
                  <th>배분액</th>
                  <th>순매출</th>
                  <th>비중</th>
                </tr>
              </thead>
              <tbody>
                {revTypes
                  .map((t) => ({ t, a: agg((r) => r.revenue_type === t) }))
                  .sort((x, y) => y.a.net - x.a.net)
                  .map(({ t, a }) => (
                    <tr key={t}>
                      <td className="l">{t}</td>
                      <td>{a.gross ? won(a.gross) : "-"}</td>
                      <td>{a.share ? won(a.share) : "-"}</td>
                      <td>{won(a.net)}</td>
                      <td>{total.net ? ((a.net / total.net) * 100).toFixed(1) + "%" : "-"}</td>
                    </tr>
                  ))}
                <tr className="total-row">
                  <td className="l">합계</td>
                  <td>{won(total.gross)}</td>
                  <td>{total.share ? won(total.share) : "-"}</td>
                  <td>{won(total.net)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
