import { fetchAll, netRevenue, latestActualMonth } from "@/lib/queries";
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

  const summarize = (f) => ({
    views: f.reduce((s, r) => s + (Number(r.views) || 0), 0),
    subs: f.reduce((s, r) => s + (Number(r.subscribers) || 0), 0),
    gross: f.reduce((s, r) => s + (Number(r.gross_revenue) || 0), 0),
    share: f.reduce((s, r) => s + (Number(r.share_amount) || 0), 0),
    net: f.reduce((s, r) => s + netRevenue(r), 0),
  });

  const agg = (filter) => summarize(rows.filter(filter));

  // 월별 통합에서는 공동매출(뉴미디어·인서트애드)을 제외한다.
  // 채널 매출이 아니라 건별 계약 금액이라 월별 추이를 왜곡한다.
  const EXCLUDED_MONTHLY = ["공동매출(뉴미디어)"];
  const monthlyRows = rows.filter((r) => !EXCLUDED_MONTHLY.includes(r.revenue_type));
  const aggM = (filter) => summarize(monthlyRows.filter(filter));

  const total = agg(() => true);
  const monthTotal = aggM(() => true);
  const excluded = summarize(rows.filter((r) => EXCLUDED_MONTHLY.includes(r.revenue_type)));
  const estimated = rows.some((r) => r.actual_type === "추정");
  const lastMonth = latestActualMonth(digital, year);

  return (
    <div>
      <h1>디지털사업팀 채널별 실적</h1>
      <p className="subtitle">
        조회수 · 구독자 증감 · 총매출 · 배분액 · 순매출 (순매출 = 총매출 + 배분액)
      </p>

      <YearFilter
        basePath="/digital"
        year={year}
        years={[2024, 2025, 2026]}
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
          {year}년 실적은 <strong>1~{lastMonth}월분</strong>까지이고, 나머지는 추정치가 포함되어 있습니다.
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
            <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>
              월별 통합
              <span className="badge">공동매출 제외</span>
            </h2>
            <p className="subtitle" style={{ marginBottom: 12 }}>
              채널 매출 기준 · 공동매출(뉴미디어·인서트애드){" "}
              {excluded.net ? won(excluded.net) : "0원"}은 건별 계약이라 제외했습니다.
            </p>
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
                  const a = aggM((r) => r.month === m);
                  const est = monthlyRows.some(
                    (r) => r.month === m && r.actual_type === "추정"
                  );
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
                  <td>{num(monthTotal.views)}</td>
                  <td>{num(monthTotal.subs)}</td>
                  <td>{won(monthTotal.gross)}</td>
                  <td>{monthTotal.share ? won(monthTotal.share) : "-"}</td>
                  <td>{won(monthTotal.net)}</td>
                </tr>
              </tbody>
            </table>
            {excluded.net > 0 && (
              <p className="subtitle" style={{ marginTop: 10, marginBottom: 0 }}>
                위 합계 {won(monthTotal.net)} + 공동매출 {won(excluded.net)} ={" "}
                <strong>전체 순매출 {won(total.net)}</strong> (상단 카드 값)
              </p>
            )}
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
