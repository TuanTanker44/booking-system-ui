import { Link, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../app/auth';

export function StaffLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar staff-sidebar">
        <h1>Booking System</h1>
        <span className="role-badge">STAFF</span>
        <nav>
          <Link to="/staff">Dashboard</Link>
          <Link to="/staff/bookings">Bookings</Link>
          <Link to="/staff/hotels">Hotels</Link>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span>{user?.name ?? 'Staff'}</span>
          <button onClick={handleLogout}>Logout</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
