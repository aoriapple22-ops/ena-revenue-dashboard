import { fetchAll, netRevenue, digitalActualForTargets } from "@/lib/queries";
import { eok, num, pct, rateClass } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { nsd, digital, program, targets, error } = await fetchAll();

  if (error) {
    return <p>데이터를 불러오지 못했습니다: {error.message}</p>;
  }

  const years = [2024, 2025, 2026];

  const nsdY = (y) =>
    nsd.filter((r) => r.year === y).reduce((s, r) => s + Number(r.amount), 0);

  const digGross = (y) =>
    digital.filter((r) => r.year === y).reduce((s, r) => s + (Number(r.gross_revenue) || 0), 0);
  const digNet = (y) =>
    digital.filter((r) => r.year === y).reduce((s, r) => s + netRevenue(r), 0);
  const digViews = (y) =>
    digital.filter((r) => r.year === y).reduce((s, r) => s + (Number(r.views) || 0), 0);

  // 목표는 팀 단위로만 비교한다 (팀별 목표 유무가 달라 합산하면 기준이 섞임)
  const tgt = (y, team) =>
    targets.filter((t) => t.year === y && t.metric === "매출" && t.team === team)
      .reduce((s, t) => s + Number(t.value), 0);

  return (
    <div>
      <h1>신성장센터 매출 대시보드</h1>
      <p className="subtitle">
        2024~2026년 신사업개발팀·디지털사업팀 실적 · 신사업 매출은 계약 기준
      </p>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">신사업개발팀 25년 매출</div>
          <div className="value">{eok(nsdY(2025))}</div>
          <div className="sub">24년 {eok(nsdY(2024))} · 26년 {eok(nsdY(2026))}</div>
        </div>
        <div className="kpi">
          <div className="label">디지털사업팀 25년 순매출</div>
          <div className="value">{eok(digNet(2025))}</div>
          <div className="sub">총매출 {eok(digGross(2025))} · 배분 차감 후</div>
        </div>
        <div className="kpi">
          <div className="label">디지털 25년 조회수</div>
          <div className="value">{num(digViews(2025))}</div>
          <div className="sub">24년 {num(digViews(2024))}</div>
        </div>
        <div className="kpi">
          <div className="label">프로그램별 등록 타이틀</div>
          <div className="value">{program.length}건</div>
          <div className="sub">24~25년 · ENA 채널 기준</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>연도별 요약</h2>
        <table>
          <thead>
            <tr>
              <th className="l" rowSpan={2}>연도</th>
              <th colSpan={3}>신사업개발팀</th>
              <th colSpan={4}>디지털사업팀</th>
            </tr>
            <tr>
              <th>매출</th>
              <th>목표</th>
              <th>달성률</th>
              <th>총매출</th>
              <th>순매출</th>
              <th>목표</th>
              <th>달성률</th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => {
              const nT = tgt(y, "신사업개발팀");
              const dT = tgt(y, "디지털사업팀");
              const nRate = nT ? (nsdY(y) / nT) * 100 : null;
              // 목표가 있는 매출구분만 비교한다 (24년 목표는 유튜브 전용이라 전체와 비교하면 왜곡)
              const dA = digitalActualForTargets(digital, targets, y).actual;
              const dRate = dT && dA ? (dA / dT) * 100 : null;
              return (
                <tr key={y}>
                  <td className="l">{y}년</td>
                  <td>{nsdY(y) ? eok(nsdY(y)) : "-"}</td>
                  <td>{nT ? eok(nT) : "-"}</td>
                  <td className={rateClass(nRate)}>{nRate ? pct(nRate) : "-"}</td>
                  <td>{digGross(y) ? eok(digGross(y)) : "-"}</td>
                  <td>{digNet(y) ? eok(digNet(y)) : "-"}</td>
                  <td>{dT ? eok(dT) : "-"}</td>
                  <td className={rateClass(dRate)}>{dRate ? pct(dRate) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="note">
        <strong>데이터 범위 안내</strong><br />
        · 신사업개발팀은 25년만 월별이고, 24·26년은 연간 합계만 있습니다.<br />
        · 디지털사업팀 26년 실적은 <strong>1~3월분</strong>까지 반영되어 있습니다.<br />
        · 프로그램별 수치는 ENA 채널 기준이라 채널별 매출과 합산하지 않습니다.
      </div>

      <div className="home-grid">
        <a className="tile" href="/nsd">
          <h2>신사업개발팀 매출</h2>
          <p>건기식·브랜디드·기타사업(협찬)·커머스 4개 사업군. 25년 월별 및 전년 대비.</p>
        </a>
        <a className="tile" href="/digital">
          <h2>디지털 채널별</h2>
          <p>채널별 조회수·구독자·총매출·배분액·순매출. 월별/연간, 통합 조회.</p>
        </a>
        <a className="tile" href="/program">
          <h2>프로그램별 <span className="badge">ENA 한정</span></h2>
          <p>예능 타이틀별 조회수·수익·시청률(2049/가구).</p>
        </a>
        <a className="tile" href="/target">
          <h2>목표 대비 달성률</h2>
          <p>25·26년 목표와 실적 비교. 매출·조회수·구독자 지표별.</p>
        </a>
      </div>
    </div>
  );
}
