export function won(n) {
  if (n === null || n === undefined) return "-";
  return new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";
}

export function eok(n) {
  if (n === null || n === undefined) return "-";
  return (n / 100000000).toFixed(2) + "억";
}

export function num(n) {
  if (n === null || n === undefined) return "-";
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

export function pct(n) {
  if (n === null || n === undefined || !isFinite(n)) return "-";
  return n.toFixed(1) + "%";
}

export function periodLabel(period) {
  if (!period) return "-";
  if (period.endsWith("-Y")) return period.slice(0, 4) + "년";
  const m = period.match(/^(\d{4})-M(\d{2})$/);
  if (m) return `${m[1]}.${m[2]}`;
  return period;
}

export function rateClass(n) {
  if (n === null || n === undefined || !isFinite(n)) return "";
  return n >= 100 ? "diff-up" : "diff-down";
}
