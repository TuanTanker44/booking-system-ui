import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, hasAccessToken } from '../app/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (hasAccessToken() && user) {
      navigate(`/${user.role.toLowerCase()}`, { replace: true });
    }
  }, [navigate, user]);

  const handleDemoLogin = (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => {
    localStorage.setItem('accessToken', `demo-token-${role.toLowerCase()}`);
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: `${role.toLowerCase()}-1`,
        name: role[0] + role.slice(1).toLowerCase(),
        email: `${role.toLowerCase()}@example.com`,
        role,
      }),
    );
    navigate(`/${role.toLowerCase()}`, { replace: true });
  };

  return (
    <section className="auth-page">
      <div className="card">
        <h1>Booking System</h1>
        <p>Role-based router scaffold</p>
        <button onClick={() => handleDemoLogin('ADMIN')}>Login as Admin</button>
        <button onClick={() => handleDemoLogin('STAFF')}>Login as Staff</button>
        <button onClick={() => handleDemoLogin('CUSTOMER')}>Login as Customer</button>
      </div>
    </section>
  );
}
