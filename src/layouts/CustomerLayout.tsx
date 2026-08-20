import { Link, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../app/auth';

export function CustomerLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell customer-shell">
      <header className="customer-header">
        <strong>Booking System</strong>
        <nav>
          <Link to="/customer">Home</Link>
          <Link to="/customer/bookings">My Bookings</Link>
        </nav>
        <span>{user?.name ?? 'Customer'}</span>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main className="customer-content">
        <Outlet />
      </main>
    </div>
  );
}
