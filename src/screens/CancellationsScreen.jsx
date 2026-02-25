import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./CancellationsScreen.css";

const STAT_ITEMS = [
  { label: "Total Cancelled", value: "0", subtitle: "All time", color: "#4A5565", icon: "cancel" },
  { label: "Today", value: "0", subtitle: "$0 lost", color: "#E7000B", icon: "alert" },
  { label: "This Week", value: "0", subtitle: "$0 lost", color: "#F54900", icon: "orders" },
  { label: "Lost Revenue", value: "$0", subtitle: "Total potential earnings", color: "#E7000B", icon: "payments" },
];

const TIPS = [
  "Ensure accurate product descriptions and images",
  "Provide realistic delivery timeframes and updates",
  "Keep inventory updated to avoid cancellations due to stockouts",
  "Respond quickly to customer queries before they cancel",
  "Offer competitive pricing and consider price-match options",
];

function CancellationsScreen() {
  const navigate = useNavigate();
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <SellerLayout selectedMenu="Orders" title="Cancellations" subtitle={formattedDate} contentClassName="no-pad">
      <main className="cancel-content">
        <button type="button" className="cancel-back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="cancel-title-wrap">
          <div className="cancel-title-icon">
            <img src="/icons/cancel.svg" alt="" />
          </div>
          <div>
            <h2>Cancellations</h2>
            <p>Track cancelled orders and analyze trends</p>
          </div>
        </section>

        <section className="cancel-stats-grid">
          {STAT_ITEMS.map((item) => (
            <article key={item.label} className="cancel-stat-card">
              <div className="cancel-stat-head">
                <span>{item.label}</span>
                <img src={`/icons/${item.icon}.svg`} alt="" />
              </div>
              <h3 style={{ color: item.color }}>{item.value}</h3>
              <p>{item.subtitle}</p>
            </article>
          ))}
        </section>

        <section className="cancel-charts-row">
          <article className="cancel-card">
            <h3>Cancellation Trend (7 Days)</h3>
            <p className="cancel-card-sub">Daily cancellation count</p>
            <div className="cancel-chart-placeholder">Chart placeholder (Bar chart showing cancellation trend)</div>
          </article>

          <article className="cancel-card">
            <h3>Cancellation Reasons</h3>
            <p className="cancel-card-sub">Top reasons for order cancellation</p>
            <div className="cancel-chart-placeholder">No cancellation data</div>
          </article>
        </section>

        <section className="cancel-card recent-cancel-card">
          <h3>Recent Cancellations</h3>
          <p className="cancel-card-sub">Latest cancelled orders</p>
          <div className="empty-cancel-wrap">
            <img src="/icons/cancel.svg" alt="" />
            <h4>No Cancellations</h4>
            <p>Great! You haven&apos;t had any cancelled orders</p>
          </div>
        </section>

        <section className="cancel-tips-card">
          <h3>Reduce Cancellations</h3>
          <div className="tips-list">
            {TIPS.map((tip) => (
              <p key={tip}>• {tip}</p>
            ))}
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

export default CancellationsScreen;
