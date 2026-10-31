import {
  AlertTriangle, CheckCircle2, ClipboardList, Truck, WashingMachine, Shirt
} from "lucide-react";
import type { DashboardStat } from "../../../types/staff";

const icons = {
  orders: ClipboardList,
  washing: WashingMachine,
  truck: Truck,
  check: CheckCircle2,
  machine: Shirt,
  alert: AlertTriangle,
};

export default function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = icons[stat.icon];
  return (
    <article className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${stat.tone}`}><Icon size={21} /></div>
      <div className="stat-card__body">
        <span className="stat-card__label">{stat.label}</span>
        <strong className="stat-card__value">{stat.value}</strong>
        <span className="stat-card__hint">{stat.hint}</span>
      </div>
    </article>
  );
}
