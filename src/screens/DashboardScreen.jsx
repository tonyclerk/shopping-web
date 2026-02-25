import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./DashboardScreen.css";

const STAT_CARDS = [
  { label: "Today's Orders", value: "25", icon: "orders", iconBg: "#EFF6FF" },
  { label: "Today's Revenue", value: "$68,772", icon: "payments", iconBg: "#F0FDF4" },
  { label: "Pending Fulfillment", value: "18", icon: "products", iconBg: "#FFF7ED" },
  { label: "Low Stock Alerts", value: "2", icon: "alert", iconBg: "#FEF2F2" },
  { label: "Returns", value: "1", icon: "returns", iconBg: "#FAF5FF" },
  { label: "Cancellations", value: "0", icon: "cancel", iconBg: "#F9FAFB" },
];

const INSIGHTS = [
  {
    message: "You have 18 orders pending fulfillment",
    badge: "Action Required",
    icon: "products",
    bg: "#FFF7ED",
    color: "#F54900",
  },
  {
    message: "2 products are running low on stock",
    badge: "Restock Soon",
    icon: "alert",
    bg: "#FEF2F2",
    color: "#E7000B",
  },
  {
    message: "1 return requests need your attention",
    badge: "Review Now",
    icon: "returns",
    bg: "#FAF5FF",
    color: "#9810FA",
  },
];

function DashboardScreen() {
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

  const handleStatCardClick = (label) => {
    if (label === "Today's Orders") {
      navigate("/todays-orders");
      return;
    }

    if (label === "Pending Fulfillment") {
      navigate("/pending-fulfillment");
      return;
    }

    if (label === "Today's Revenue") {
      navigate("/todays-revenue");
      return;
    }

    if (label === "Low Stock Alerts") {
      navigate("/low-stock-alerts");
      return;
    }

    if (label === "Returns") {
      navigate("/returns-management");
      return;
    }

    if (label === "Cancellations") {
      navigate("/cancellations");
    }
  };

  return (
    <SellerLayout selectedMenu="Dashboard" title="Dashboard" subtitle={formattedDate} contentClassName="no-pad">
      <main className="dashboard-content">
        <section>
          <h2 className="welcome-title">John Doe</h2>
          <p className="welcome-subtitle">Welcome back! Here's your business overview.</p>
        </section>

        <section className="stats-grid">
          {STAT_CARDS.map((card) => (
            <button key={card.label} type="button" className="card-box stat-card" onClick={() => handleStatCardClick(card.label)}>
              <div>
                <p className="stat-label">{card.label}</p>
                <p className="stat-value">{card.value}</p>
              </div>
              <div className="stat-icon-wrap" style={{ backgroundColor: card.iconBg }}>
                <img src={`/icons/${card.icon}.svg`} alt="" />
              </div>
            </button>
          ))}
        </section>

        <section className="chart-row">
          <article className="card-box chart-card">
            <h3>Sales Trend (7 Days)</h3>
            <p>Chart placeholder (line chart showing sales trend)</p>
          </article>
          <article className="card-box chart-card">
            <h3>Order Volume (7 Days)</h3>
            <p>Chart placeholder (bar chart showing order volume)</p>
          </article>
        </section>

        <section className="card-box insights-card">
          <h3>Quick Insights</h3>
          <div className="insights-list">
            {INSIGHTS.map((insight) => (
              <div key={insight.message} className="insight-item" style={{ backgroundColor: insight.bg }}>
                <img src={`/icons/${insight.icon}.svg`} alt="" />
                <p>{insight.message}</p>
                <span style={{ color: insight.color }}>{insight.badge}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

export default DashboardScreen;
