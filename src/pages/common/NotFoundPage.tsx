import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="center-page">
      <div className="card">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to="/">Go home</Link>
      </div>
    </section>
  );
}
