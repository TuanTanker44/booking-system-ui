import { Sparkles } from "lucide-react";
import { formatDate } from "../../../utils/date.js";

type Props = {
  staffName: string | null;
  storeName: string | null;
};

export default function WelcomeBanner({ staffName, storeName }: Props) {
  return (
    <div className="welcome-banner">
      <div>
        <p className="eyebrow">BẢNG ĐIỀU KHIỂN NHÂN VIÊN</p>
        <h1><span aria-hidden="true">👋</span> Xin chào, {staffName}!</h1>
        <p>
          Chúc bạn có một ngày làm việc hiệu quả tại{" "}
          <strong>{storeName}</strong>.
        </p>
      </div>
      <div className="welcome-banner__date">
        <Sparkles size={17} />
        Hôm nay, {formatDate()}
      </div>
    </div>
  );
}