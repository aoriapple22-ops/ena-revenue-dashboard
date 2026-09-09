// 연도별 월간 비교 막대그래프 (인라인 SVG — 외부 차트 라이브러리 없음)
// series: [{ year, values: [12개, null이면 미표시] }]

const PALETTE = ["#cfcdf2", "#8b85e4", "#2c24ce", "#161057"];

// 눈금이 0.6 / 1.3 처럼 떨어지지 않게, 간격부터 깔끔한 값으로 고르고 상한을 맞춘다
function niceScale(maxVal, intervals = 4) {
  if (!(maxVal > 0)) return { top: 1, step: 0.25 };
  const raw = (maxVal * 1.08) / intervals;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { top: Math.ceil((maxVal * 1.08) / step) * step, step };
}

export default function YoyBarChart({ title, subtitle, series, unit = "억" }) {
  const live = series.filter((s) => s.values.some((v) => v !== null && v !== undefined));
  if (live.length === 0) return null;

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const maxVal = Math.max(
    ...live.flatMap((s) => s.values.map((v) => Number(v) || 0)),
    0
  );
  const { top, step } = niceScale(maxVal);
  const decimals = step < 1 ? String(step).split(".")[1]?.length || 1 : 0;

  const W = 760;
  const H = 250;
  const padL = 48;
  const padR = 8;
  const padT = 10;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const groupW = plotW / 12;
  const innerPad = 7;
  const barW = Math.max(4, (groupW - innerPad) / live.length);

  const ticks = [];
  for (let t = 0; t <= top + step / 1000; t += step) ticks.push(t);
  const y = (v) => padT + plotH - (v / top) * plotH;

  return (
    <div className="chart">
      <div className="chart-head">
        <h2>{title}</h2>
        <div className="chart-legend">
          {live.map((s, i) => (
            <span key={s.year}>
              <i style={{ background: PALETTE[i % PALETTE.length] }} />
              {s.year}년
            </span>
          ))}
        </div>
      </div>
      {subtitle && <p className="chart-sub">{subtitle}</p>}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title} — 연도별 월간 비교 막대그래프`}
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke={i === 0 ? "#9ca3af" : "#eceaf7"}
              strokeWidth="1"
            />
            <text x={padL - 7} y={y(t) + 3.5} textAnchor="end" className="ax">
              {t === 0 ? "0" : t.toFixed(decimals)}
            </text>
          </g>
        ))}
        <text x={4} y={padT + 2} className="ax unit">
          ({unit})
        </text>

        {months.map((m, mi) => {
          const gx = padL + mi * groupW;
          return (
            <g key={m}>
              {live.map((s, si) => {
                const v = s.values[mi];
                if (v === null || v === undefined) return null;
                const val = Number(v) || 0;
                const bx = gx + innerPad / 2 + si * barW;
                const bh = Math.max(val > 0 ? 1.2 : 0, (val / top) * plotH);
                return (
                  <rect
                    key={s.year}
                    x={bx}
                    y={padT + plotH - bh}
                    width={barW - 1.2}
                    height={bh}
                    fill={PALETTE[si % PALETTE.length]}
                    rx="1.5"
                  >
                    <title>{`${s.year}년 ${m}월 · ${val.toFixed(2)}${unit}`}</title>
                  </rect>
                );
              })}
              <text x={gx + groupW / 2} y={H - 8} textAnchor="middle" className="ax">
                {m}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
