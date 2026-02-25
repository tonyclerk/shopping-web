import { Link } from "react-router-dom";

function NotFoundScreen() {
  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Page Not Found</h1>
        <p className="subtitle">The route does not exist.</p>
        <Link to="/login" style={{ marginTop: 16, display: "inline-block" }}>
          Go to Login
        </Link>
      </section>
    </main>
  );
}

export default NotFoundScreen;
