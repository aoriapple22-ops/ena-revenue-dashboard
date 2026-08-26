"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function YearFilter({ basePath, year, years, extra }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="filters">
      <label>연도</label>
      <select value={year} onChange={(e) => update("year", e.target.value)}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
      {(extra || []).map((f) => (
        <span key={f.key} style={{ display: "contents" }}>
          <label>{f.label}</label>
          <select value={f.value} onChange={(e) => update(f.key, e.target.value)}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </span>
      ))}
    </div>
  );
}
