import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <section className="center-page">
      <div className="card">
        <h1>403</h1>
        <p>You do not have permission to access this page.</p>
        <Link to="/">Go home</Link>
      </div>
    </section>
  );
}
