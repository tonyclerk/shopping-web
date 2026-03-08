import { useNavigate } from "react-router-dom";

function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Welcome to Vendor Portal</h1>
        <p className="subtitle">Choose how you want to continue.</p>

        <button className="button" onClick={() => navigate("/auth/login")}>
          Login
        </button>
        <button className="button secondary-button" onClick={() => navigate("/auth/signup")}>
          Register
        </button>
      </section>
    </main>
  );
}

export default WelcomeScreen;
