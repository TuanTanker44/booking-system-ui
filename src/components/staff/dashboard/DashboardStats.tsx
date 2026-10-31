import type { DashboardStat } from "../../../types/staff";
import StatCard from "./StatCard";

export default function DashboardStats({ stats }: { stats: DashboardStat[] }) {
  return <section className="dashboard-stats" aria-label="Thống kê cửa hàng">
    {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
  </section>;
}
