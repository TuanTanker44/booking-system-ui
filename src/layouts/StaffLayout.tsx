import { Outlet } from "react-router-dom";
import StaffSidebar from "../components/staff/layout/StaffSidebar";
import "../styles/staff-dashboard.css";

export default function StaffLayout() {
  return <div className="staff-app-shell">
    <StaffSidebar />
    <main className="staff-main"><Outlet /></main>
  </div>;
}
