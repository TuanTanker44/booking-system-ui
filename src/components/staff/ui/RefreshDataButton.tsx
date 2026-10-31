import { RefreshCw } from "lucide-react";
import "./RefreshDataButton.css";

export default function RefreshDataButton({ onRefresh, loading = false, disabled = false }: {
  onRefresh: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="staff-refresh-button" onClick={onRefresh}
      disabled={loading || disabled} aria-busy={loading}>
      <RefreshCw size={16} className={loading ? "staff-refresh-button__spinner" : undefined} />
      Làm mới dữ liệu
    </button>
  );
}
