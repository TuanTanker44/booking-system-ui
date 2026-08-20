import { Link, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../app/auth';

export function AdminLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar admin-sidebar">
        <h1>Booking System</h1>
        <span className="role-badge">ADMIN</span>
        <nav>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/bookings">Bookings</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/hotels">Hotels</Link>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span>{user?.name ?? 'Admin'}</span>
          <button onClick={handleLogout}>Logout</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
