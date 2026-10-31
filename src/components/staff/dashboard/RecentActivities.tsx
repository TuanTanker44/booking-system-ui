import { Activity, type LucideIcon } from "lucide-react";
import SectionCard from "../ui/SectionCard";

type ActivityItem = { id: string; title: string; time: string; by: string; tone: string; icon: LucideIcon };

export default function RecentActivities({ items }: { items: ActivityItem[] }) {
  return (
    <SectionCard title="Hoạt động gần đây" icon={<Activity size={19} />}>
      {items.length === 0 && <p>Chưa có dữ liệu hoạt động gần đây.</p>}
      <div className="activity-list">
        {items.map((item) => {
          const Icon = item.icon;
          return <div className="activity-item" key={item.id}>
            <span className={`activity-item__icon activity-item__icon--${item.tone}`}><Icon size={18} /></span>
            <div className="activity-item__content"><p>{item.title}</p><small>{item.time} <span>•</span> {item.by}</small></div>
          </div>;
        })}
      </div>
    </SectionCard>
  );
}
