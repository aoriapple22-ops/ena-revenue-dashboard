import { fetchAll } from "@/lib/queries";
import { won, num } from "@/lib/format";
import YearFilter from "@/components/YearFilter";

export const dynamic = "force-dynamic";

export default async function ProgramPage({ searchParams }) {
  const year = Number(searchParams.year) || 2025;
  const sort = searchParams.sort || "revenue";
  const { program, drama, error } = await fetchAll();
  if (error) return <p>데이터를 불러오지 못했습니다: {error.message}</p>;

  const rows = program
    .filter((r) => r.year === year)
    .sort((a, b) =>
      sort === "views"
        ? Number(b.views) - Number(a.views)
        : Number(b.revenue) - Number(a.revenue)
    );

  const sum = (f) => rows.reduce((s, r) => s + (Number(f(r)) || 0), 0);
  const avg = (f) => (rows.length ? sum(f) / rows.length : 0);

  const dramaRows = drama
    .filter((r) => r.year === year)
    .map((r) => ({
      ...r,
      views: Number(r.clip_views) + Number(r.shorts_views),
      revenue: Number(r.clip_revenue) + Number(r.shorts_revenue),
    }))
    .sort((a, b) =>
      sort === "views" ? b.views - a.views : b.revenue - a.revenue
    );
  const dsum = (f) => dramaRows.reduce((s, r) => s + (Number(f(r)) || 0), 0);

  // 상단 KPI는 예능 + 드라마 전체 타이틀 기준
  const allRows = [...rows, ...dramaRows];
  const asum = (f) => allRows.reduce((s, r) => s + (Number(f(r)) || 0), 0);
  const aavg = (f) => (allRows.length ? asum(f) / allRows.length : 0);

  return (
    <div>
      <h1>
        프로그램별 실적
        <span className="badge">ENA · ENA DRAMA 채널 기준</span>
      </h1>
      <p className="subtitle">
        예능 · 드라마 타이틀별 조회수 · 예상수익 · 시청률 (연간 단위)
      </p>

      <div className="note">
        이 화면의 수치는 <strong>ENA · ENA DRAMA 채널 기준</strong>입니다. 디지털 채널별 매출과는
        집계 기준이 달라 <strong>합산하면 안 됩니다.</strong>
      </div>

      <YearFilter
        basePath="/program"
        year={year}
        years={[2024, 2025]}
        extra={[
          {
            key: "sort",
            label: "정렬",
            value: sort,
            options: [
              { value: "revenue", label: "수익순" },
              { value: "views", label: "조회수순" },
            ],
          },
        ]}
      />

      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">타이틀 수</div>
          <div className="value">{allRows.length}건</div>
          <div className="sub">
            예능 {rows.length} · 드라마 {dramaRows.length}
          </div>
        </div>
        <div className="kpi">
          <div className="label">조회수 합계</div>
          <div className="value">{num(asum((r) => r.views))}</div>
          <div className="sub">평균 {num(aavg((r) => r.views))}</div>
        </div>
        <div className="kpi">
          <div className="label">예상수익 합계</div>
          <div className="value">{won(asum((r) => r.revenue))}</div>
          <div className="sub">평균 {won(aavg((r) => r.revenue))}</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th className="l">타이틀</th>
              <th className="l">방영기간</th>
              <th>게시물</th>
              <th>조회수</th>
              <th>구독자</th>
              <th>예상수익</th>
              <th>시청률(2049)</th>
              <th>시청률(가구)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="l">{r.title}</td>
                <td className="l" style={{ color: "#6b7280", fontSize: 12 }}>
                  {r.air_period}
                </td>
                <td>{num(r.posts)}</td>
                <td>{num(r.views)}</td>
                <td>{num(r.subscribers)}</td>
                <td>{won(r.revenue)}</td>
                <td>{r.rating_2049 ?? "-"}</td>
                <td>{r.rating_home ?? "-"}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td className="l" colSpan={2}>
                {year}년 합계 / 평균
              </td>
              <td>{num(sum((r) => r.posts))}</td>
              <td>{num(sum((r) => r.views))}</td>
              <td>{num(sum((r) => r.subscribers))}</td>
              <td>{won(sum((r) => r.revenue))}</td>
              <td>{avg((r) => r.rating_2049).toFixed(3)}</td>
              <td>{avg((r) => r.rating_home).toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {dramaRows.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>
            드라마 <span className="badge">{year}년 방영작</span>
            <span
              style={{
                marginLeft: 10,
                fontSize: 12,
                fontWeight: 400,
                color: "#6b7280",
              }}
            >
              *{year}년 1/1 ~ 12/31 기간 발생 실적으로 집계(참고용, ROI와 차이 있음)
            </span>
          </h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th className="l">드라마</th>
                  <th className="l">방영기간</th>
                  <th>조회수</th>
                  <th>예상수익</th>
                  <th>시청률(2049)</th>
                  <th>시청률(가구)</th>
                </tr>
              </thead>
              <tbody>
                {dramaRows.map((r) => (
                  <tr key={r.id}>
                    <td className="l">{r.title}</td>
                    <td className="l" style={{ color: "#6b7280", fontSize: 12 }}>
                      {r.air_period}
                    </td>
                    <td>{num(r.views)}</td>
                    <td>{won(r.revenue)}</td>
                    <td>{r.rating_2049 ?? "-"}</td>
                    <td>{r.rating_home ?? "-"}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="l" colSpan={2}>
                    {year}년 합계
                  </td>
                  <td>{num(dsum((r) => r.views))}</td>
                  <td>{won(dsum((r) => r.revenue))}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
