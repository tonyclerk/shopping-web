import { useNavigate } from "react-router-dom";
import "./ApprovalPendingScreen.css";

function ApprovalPendingScreen() {
  const navigate = useNavigate();

  return (
    <div className="approval-shell">
      <section className="approval-card">
        <div className="approval-icon-wrap">
          <img src="/icons/clock.svg" alt="" />
        </div>

        <h1>Approval Pending</h1>
        <p className="approval-subtitle">Your vendor account is under review. You&apos;ll be notified once approved.</p>

        <div className="approval-status-card">
          <div>
            <span>Status</span>
            <strong>Pending Review</strong>
          </div>
          <div>
            <span>Expected Time</span>
            <strong className="muted">Within 24 hours</strong>
          </div>
        </div>

        <p className="approval-note">For demo purposes, you can simulate approval by refreshing or clicking below.</p>

        <button type="button" className="approval-open-btn" onClick={() => navigate("/dashboard", { replace: true })}>
          Open Dashboard
        </button>
      </section>
    </div>
  );
}

export default ApprovalPendingScreen;
