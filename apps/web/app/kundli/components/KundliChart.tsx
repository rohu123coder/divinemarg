"use client";

import { useMemo } from "react";
import type { KundliChartPayload } from "../types";

const VB = { w: 400, h: 400 };
/** Scale gist coords (y in 0–300) to 400×400 viewBox */
const sy = (y: number) => (y * VB.h) / 300;

/** North Indian diamond chart — polygon layout (standard construction), houses 1–12 */
const HOUSE_POLYGONS: [number, number][][] = [
  // 1 — top kendra (Lagna)
  [
    [100, 75],
    [200, 150],
    [300, 75],
    [200, 0],
  ],
  // 2
  [
    [0, 0],
    [100, 75],
    [200, 0],
  ],
  // 3
  [
    [0, 0],
    [0, 150],
    [100, 75],
  ],
  // 4
  [
    [0, 150],
    [100, 225],
    [200, 150],
    [100, 75],
  ],
  // 5
  [
    [0, 150],
    [0, 300],
    [100, 225],
  ],
  // 6
  [
    [0, 300],
    [100, 225],
    [200, 300],
  ],
  // 7 — bottom kendra
  [
    [100, 225],
    [200, 300],
    [300, 225],
    [200, 150],
  ],
  // 8
  [
    [300, 225],
    [200, 300],
    [400, 300],
  ],
  // 9
  [
    [300, 225],
    [400, 300],
    [400, 150],
  ],
  // 10 — right kendra
  [
    [300, 75],
    [200, 150],
    [300, 225],
    [400, 150],
  ],
  // 11
  [
    [300, 75],
    [400, 150],
    [400, 0],
  ],
  // 12
  [
    [200, 0],
    [300, 75],
    [400, 0],
  ],
];

const HOUSE_CENTERS: [number, number][] = [
  [190, 75],
  [100, 30],
  [30, 75],
  [90, 150],
  [30, 225],
  [90, 278],
  [190, 225],
  [290, 278],
  [360, 225],
  [290, 150],
  [360, 75],
  [290, 30],
];

const PLANET_SHORT: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
};

function toPath(points: [number, number][]): string {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${sy(y)}`)
    .join(" ") + " Z";
}

export function KundliChart({
  chartData,
  className = "",
}: {
  chartData: KundliChartPayload;
  className?: string;
}) {
  const byHouse = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (let h = 1; h <= 12; h++) map[h] = [];
    for (const [planet, house] of Object.entries(chartData.planetHouseMap)) {
      if (!map[house]) map[house] = [];
      map[house].push(PLANET_SHORT[planet] ?? planet.slice(0, 2));
    }
    return map;
  }, [chartData.planetHouseMap]);

  return (
    <div
      className={`rounded-2xl border border-violet-200/80 bg-gradient-to-br from-white to-violet-50/90 p-4 shadow-lg shadow-violet-200/40 ${className}`}
    >
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-violet-600">
        North Indian (D1) · Whole sign
      </p>
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="mx-auto h-auto w-full max-w-[400px]"
        role="img"
        aria-label="North Indian style Vedic birth chart"
      >
        <defs>
          <linearGradient id="houseFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#faf5ff" />
            <stop offset="100%" stopColor="#ede9fe" />
          </linearGradient>
          <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <rect
          x="0"
          y="0"
          width={VB.w}
          height={VB.h}
          rx="12"
          fill="#f5f3ff"
          stroke="url(#edgeGlow)"
          strokeWidth="2"
        />

        {HOUSE_POLYGONS.map((pts, i) => (
          <path
            key={i}
            d={toPath(pts)}
            fill="url(#houseFill)"
            stroke="#7C3AED"
            strokeOpacity={0.45}
            strokeWidth="1.25"
          />
        ))}

        {HOUSE_CENTERS.map(([cx, cy], i) => {
          const houseNum = i + 1;
          const rashi = chartData.houseRashis[i] ?? "—";
          const planets = byHouse[houseNum]?.join(" ") ?? "";
          return (
            <g key={houseNum}>
              <text
                x={cx}
                y={sy(cy) - 14}
                textAnchor="middle"
                className="fill-violet-950"
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                {houseNum}
              </text>
              <text
                x={cx}
                y={sy(cy) + 2}
                textAnchor="middle"
                className="fill-violet-800"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {rashi.length > 8 ? `${rashi.slice(0, 7)}…` : rashi}
              </text>
              {planets ? (
                <text
                  x={cx}
                  y={sy(cy) + 18}
                  textAnchor="middle"
                  className="fill-indigo-700"
                  style={{ fontSize: 9, fontWeight: 500 }}
                >
                  {planets}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
