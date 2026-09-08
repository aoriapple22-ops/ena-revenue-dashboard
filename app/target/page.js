import { fetchAll, netRevenue, targetItemTypes, latestActualMonth } from "@/lib/queries";
import { won, num, pct, rateClass, eok } from "@/lib/format";
import YearFilter from "@/components/YearFilter";

export const dynamic = "force-dynamic";

export default async function TargetPage({ searchParams }) {
  const year = Number(searchParams.year) || 2025;
  const metric = searchParams.metric || "매출";
  const { nsd, digital, targets, error } = await fetchAll();
  if (error) return <p>데이터를 불러오지 못했습니다: {error.message}</p>;

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const tRows = targets.filter((t) => t.year === year && t.metric === metric);
  const items = [...new Set(tRows.map((t) => t.item))];

  const targetOf = (item, month) =>
    tRows
      .filter((t) => t.item === item && (month === null || t.month === month))
      .reduce((s, t) => s + Number(t.value), 0);

  // 신사업 사업군은 연도별로 체계가 달라 데이터에서 뽑는다 (하드코딩 금지)
  const NSD_CATS = new Set(nsd.map((r) => r.category));

  // 실적 매칭: 사업군명은 신사업, 그 외는 디지털 매출구분/채널
  const actualOf = (item, month) => {
    if (metric === "매출" && NSD_CATS.has(item)) {
      return nsd
        .filter((r) => r.year === year && r.category === item && (month === null || r.month === month))
        .reduce((s, r) => s + Number(r.amount), 0);
    }
    const d = digital.filter(
      (r) => r.year === year && (month === null || r.month === month)
    );
    if (metric === "매출") {
      const types = targetItemTypes(item);
      return d.filter((r) => types.includes(r.revenue_type)).reduce((s, r) => s + netRevenue(r), 0);
    }
    const col = metric === "조회수" ? "views" : "subscribers";
    if (item === "전체") return d.reduce((s, r) => s + (Number(r[col]) || 0), 0);
    return d.filter((r) => r.channel === item).reduce((s, r) => s + (Number(r[col]) || 0), 0);
  };

  const fmt = metric === "매출" ? won : num;
  const totalT = items.reduce((s, i) => s + targetOf(i, null), 0);
  const totalA = items.reduce((s, i) => s + actualOf(i, null), 0);

  // month=0 은 "연간 목표만 있음"을 뜻한다. 월별 표는 월 단위 목표가 있을 때만 보여준다.
  const hasMonthlyTarget = tRows.some((t) => t.month >= 1);
  // 월별 표에는 월별 목표가 있는 항목만 넣는다.
  // (연간 목표만 있는 항목의 실적을 섞으면 목표·실적 범위가 어긋난다)
  const monthlyItems = [...new Set(tRows.filter((t) => t.month >= 1).map((t) => t.item))];
  const annualOnlyItems = items.filter((i) => !monthlyItems.includes(i));
  const lastMonth = Math.max(latestActualMonth(digital, year) || 0, latestActualMonth(nsd, year) || 0) || null;

  const availMetrics = [...new Set(targets.filter((t) => t.year === year).map((t) => t.metric))];

  // 실적은 있는데 목표가 없는 항목 (합계에서 빠지므로 별도로 알린다)
  // items 는 목표 항목명이므로, 실제 매출구분으로 펼쳐서 비교해야 한다.
  const coveredTypes = new Set(items.flatMap(targetItemTypes));
  const untracked =
    metric === "매출"
      ? [...new Set(digital.filter((r) => r.year === year).map((r) => r.revenue_type))]
          .filter((t) => !coveredTypes.has(t))
          .map((t) => ({
            item: t,
            amount: digital
              .filter((r) => r.year === year && r.revenue_type === t)
              .reduce((s, r) => s + netRevenue(r), 0),
          }))
          .filter((x) => x.amount)
      : [];

  return (
    <div>
      <h1>목표 대비 달성률</h1>
      <p className="subtitle">달성률 = 실적 ÷ 목표 × 100 · 디지털 매출은 순매출 기준</p>

      <YearFilter
        basePath="/target"
        year={year}
        years={[2024, 2025, 2026]}
        extra={[
          {
            key: "metric",
            label: "지표",
            value: metric,
            options: availMetrics.map((m) => ({ value: m, label: m })),
          },
        ]}
      />

      {lastMonth && lastMonth < 12 && (
        <div className="note">
          {year}년 실적은 <strong>1~{lastMonth}월분</strong>까지 반영되어 있습니다. 연간 목표와
          비교하는 값이므로 달성률이 낮게 보이는 것이 정상입니다.
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">{metric} 목표</div>
          <div className="value">{metric === "매출" ? eok(totalT) : num(totalT)}</div>
        </div>
        <div className="kpi">
          <div className="label">{metric} 실적</div>
          <div className="value">{metric === "매출" ? eok(totalA) : num(totalA)}</div>
          <div className="sub">목표가 설정된 항목만 집계</div>
        </div>
        <div className="kpi">
          <div className="label">달성률</div>
          <div className={"value " + rateClass(totalT ? (totalA / totalT) * 100 : null)}>
            {totalT ? pct((totalA / totalT) * 100) : "-"}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>항목별</h2>
        <table>
          <thead>
            <tr>
              <th className="l">항목</th>
              <th>목표</th>
              <th>실적</th>
              <th>달성률</th>
              <th className="l" style={{ width: 120 }}>
                진행
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const t = targetOf(item, null);
              const a = actualOf(item, null);
              const rate = t ? (a / t) * 100 : null;
              return (
                <tr key={item}>
                  <td className="l">{item}</td>
                  <td>{t ? fmt(t) : "-"}</td>
                  <td>{a ? fmt(a) : "-"}</td>
                  <td className={rateClass(rate)}>{rate === null ? "-" : pct(rate)}</td>
                  <td className="l">
                    <div className="bar">
                      <span style={{ width: Math.min(100, rate || 0) + "%" }} />
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td className="l">합계</td>
              <td>{fmt(totalT)}</td>
              <td>{totalA ? fmt(totalA) : "-"}</td>
              <td className={rateClass(totalT ? (totalA / totalT) * 100 : null)}>
                {totalT ? pct((totalA / totalT) * 100) : "-"}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {untracked.length > 0 && (
        <div className="note">
          <strong>목표가 없어 위 합계에서 빠진 항목</strong> —{" "}
          {untracked.map((u) => `${u.item} ${won(u.amount)}`).join(" · ")}
          <br />
          해당 항목의 목표를 등록하면 달성률에 포함됩니다.
        </div>
      )}

      {!hasMonthlyTarget && (
        <div className="note">
          {year}년 {metric} 목표는 <strong>연간 단위로만</strong> 설정되어 있어 월별 달성률을
          계산할 수 없습니다. 월별 목표가 등록되면 아래 표가 채워집니다.
        </div>
      )}

      {hasMonthlyTarget && (
      <div className="card">
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>월별 달성률</h2>
        {annualOnlyItems.length > 0 && (
          <p className="subtitle" style={{ marginBottom: 10 }}>
            {annualOnlyItems.join(" · ")}는 연간 목표만 있어 아래 월별 표에서 제외됩니다.
          </p>
        )}
        <table>
          <thead>
            <tr>
              <th className="l">월</th>
              <th>목표</th>
              <th>실적</th>
              <th>달성률</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => {
              const t = monthlyItems.reduce((s, i) => s + targetOf(i, m), 0);
              const a = monthlyItems.reduce((s, i) => s + actualOf(i, m), 0);
              const rate = t ? (a / t) * 100 : null;
              return (
                <tr key={m}>
                  <td className="l">{m}월</td>
                  <td>{t ? fmt(t) : "-"}</td>
                  <td>{a ? fmt(a) : "-"}</td>
                  <td className={rateClass(rate)}>{rate === null ? "-" : pct(rate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
