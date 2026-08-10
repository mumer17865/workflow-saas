"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardStats } from "@/lib/api/dashboard";

// Validated palette (dataviz skill reference instance).
const ACCENT = { light: "#2a78d6", dark: "#3987e5" };
// Reserved status palette — never themed. Priority is an ordered severity, so
// each column is labelled on the axis; color never carries meaning alone.
const SEVERITY = ["#0ca30c", "#fab219", "#ec835a", "#d03b3b"];
const INK = { light: "#52514e", dark: "#c3c2b7" };
const MUTED = "#898781";
const GRID = { light: "#e1e0d9", dark: "#2c2c2a" };
const SURFACE = { light: "#fcfcfb", dark: "#1a1a19" };

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return dark;
}

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};
const PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const dark = useIsDark();
  const ink = dark ? INK.dark : INK.light;
  const grid = dark ? GRID.dark : GRID.light;
  const surface = dark ? SURFACE.dark : SURFACE.light;
  const accent = dark ? ACCENT.dark : ACCENT.light;

  const statusData = Object.entries(stats.tasks.byStatus).map(
    ([status, count]) => ({ name: STATUS_LABELS[status] ?? status, count }),
  );
  const priorityData = PRIORITY_ORDER.map((p, i) => ({
    name: p.charAt(0) + p.slice(1).toLowerCase(),
    count: stats.tasks.byPriority[p as keyof typeof stats.tasks.byPriority] ?? 0,
    fill: SEVERITY[i],
  }));

  const tooltipStyle = {
    background: surface,
    border: `1px solid ${grid}`,
    borderRadius: 8,
    fontSize: 12,
    color: ink,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Tasks by status">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke={grid} />
            <XAxis
              dataKey="name"
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: grid }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: dark ? "#ffffff10" : "#00000008" }}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="count" fill={accent} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tasks by priority">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={priorityData}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 8 }}
          >
            <CartesianGrid horizontal={false} stroke={grid} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: grid }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: ink, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              cursor={{ fill: dark ? "#ffffff10" : "#00000008" }}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {priorityData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
