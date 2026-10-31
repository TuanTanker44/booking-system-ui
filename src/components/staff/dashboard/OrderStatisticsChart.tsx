import { BarChart3 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SectionCard from "../ui/SectionCard";

export type OrderChartPoint = { date: string; newOrders: number; completed: number; cancelled: number };

export default function OrderStatisticsChart({ data, message }: { data: OrderChartPoint[]; message?: string }) {
  return (
    <SectionCard title="Thống kê đơn hàng" icon={<BarChart3 size={19} />} className="chart-card">
      {message || data.length === 0 ? <p role="status">{message ?? "Chưa có dữ liệu thống kê đơn hàng theo ngày."}</p> : <>
      <p className="order-chart-note">7 ngày gần nhất theo ngày tạo đơn. Hoàn thành / đã hủy là trạng thái hiện tại của các đơn tạo trong ngày.</p>
      <div className="chart-legend">
        <span><i className="legend-dot legend-dot--blue" />Đơn mới</span>
        <span><i className="legend-dot legend-dot--green" />Hoàn thành</span>
        <span><i className="legend-dot legend-dot--red" />Đã hủy</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#edf1f7" vertical={true} />
            <XAxis dataKey="date" tick={{ fill: "#71809a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#71809a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="newOrders" name="Đơn mới" stroke="#2878e8" strokeWidth={2.4} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="completed" name="Hoàn thành" stroke="#0eaa7b" strokeWidth={2.4} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="cancelled" name="Đã hủy" stroke="#f04f67" strokeWidth={2.2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      </>}
    </SectionCard>
  );
}
