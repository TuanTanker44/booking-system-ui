import { ArrowRight, WashingMachine } from "lucide-react";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";
import type { Machine } from "../../../types/staff";

export default function MachineStatusGrid({ machines, message }: { machines: Machine[]; message?: string }) {
  return (
    <SectionCard title="Trạng thái máy" icon={<WashingMachine size={19} />}
      action={<a className="text-link" href="/staff/machines">Xem tất cả <ArrowRight size={15} /></a>}
      className="machines-card">
      {(message || machines.length === 0) && <p>{message ?? "Cửa hàng chưa có máy."}</p>}
      <div className="machine-grid">
        {machines.map((machine) => (
          <article className={`machine-tile machine-tile--${machine.status === "Bảo trì" || machine.status === "Ngừng hoạt động" ? "orange" : machine.status === "Sẵn sàng" ? "blue" : "green"}`} key={machine.id}>
            <span className="machine-tile__icon"><WashingMachine size={18} /></span>
            <div className="machine-tile__body">
              <strong>{machine.name}</strong>
              <StatusBadge status={machine.status} />
              <small>{machine.detail}</small>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
