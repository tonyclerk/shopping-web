import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./TodaysRevenueScreen.css";

const ORDER_REVENUE = [
  { order: "#96851178", time: "2:24:11 AM", customer: "New Customer 259 • 1 items", earnings: "$1,805", subtotal: "$2,124", fee: "$319" },
  { order: "#96131170", time: "2:12:11 AM", customer: "New Customer 258 • 1 items", earnings: "$3,611", subtotal: "$4,248", fee: "$637" },
  { order: "#95893173", time: "2:08:13 AM", customer: "New Customer 556 • 1 items", earnings: "$1,805", subtotal: "$2,124", fee: "$319" },
  { order: "#95772174", time: "2:06:12 AM", customer: "New Customer 338 • 1 items", earnings: "$1,805", subtotal: "$2,124", fee: "$319" },
  { order: "#95651164", time: "2:04:11 AM", customer: "New Customer 354 • 1 items", earnings: "$1,805", subtotal: "$2,124", fee: "$319" },
];

function TodaysRevenueScreen() {
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
    <SellerLayout selectedMenu="Dashboard" title="Today's Revenue" subtitle={formattedDate} contentClassName="no-pad">
      <main className="today-revenue-content">
        <button type="button" className="today-revenue-back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="today-revenue-header">
          <div className="today-revenue-icon-wrap">
            <img src="/icons/payments.svg" alt="" />
          </div>
          <div>
            <h2>Today&apos;s Revenue</h2>
            <p>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}</p>
          </div>
        </section>

        <section className="today-revenue-stats-grid">
          <article className="today-revenue-stat-card highlight">
            <p>Your Earnings</p>
            <h3>$61,384</h3>
            <span>↓ 10.7% vs yesterday</span>
          </article>
          <article className="today-revenue-stat-card">
            <p>Gross Revenue</p>
            <h3>$85,215</h3>
            <span>Before commission</span>
          </article>
          <article className="today-revenue-stat-card">
            <p>Commission Paid</p>
            <h3 className="negative">$10,832</h3>
            <span>Platform fees</span>
          </article>
          <article className="today-revenue-stat-card">
            <p>Tax Collected</p>
            <h3 className="warn">$12,999</h3>
            <span>From 24 orders</span>
          </article>
        </section>

        <section className="today-revenue-chart-grid">
          <article className="today-revenue-card">
            <h3>Revenue by Hour</h3>
            <p>Today&apos;s revenue distribution throughout the day</p>
            <div className="today-revenue-chart-placeholder">Bar Chart Placeholder</div>
          </article>
          <article className="today-revenue-card">
            <h3>Revenue Breakdown</h3>
            <p>Distribution of total revenue</p>
            <div className="today-revenue-chart-placeholder">Pie Chart Placeholder</div>
            <div className="today-revenue-legend">
              <Legend label="Your Earnings" tone="green" />
              <Legend label="Commission" tone="red" />
              <Legend label="Tax" tone="amber" />
            </div>
          </article>
        </section>

        <section className="today-revenue-card">
          <h3>Order-by-Order Revenue</h3>
          <p>Detailed breakdown of each order&apos;s contribution</p>
          <div className="today-revenue-orders-list">
            {ORDER_REVENUE.map((item) => (
              <article key={item.order} className="today-revenue-order-item">
                <div>
                  <h4>
                    Order {item.order}
                    <span>{item.time}</span>
                  </h4>
                  <p>{item.customer}</p>
                </div>
                <div className="today-revenue-order-values">
                  <strong>{item.earnings}</strong>
                  <small>
                    Subtotal: {item.subtotal} • Fee: {item.fee}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="today-revenue-card">
          <h3>Comparison with Yesterday</h3>
          <div className="today-revenue-compare-grid">
            <article>
              <p>Yesterday</p>
              <h4>$68,772</h4>
              <span>25 orders</span>
            </article>
            <article className="today">
              <p>Today</p>
              <h4>$61,384</h4>
              <span>24 orders</span>
            </article>
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

function Legend({ label, tone }) {
  return (
    <div className={`legend-item ${tone}`}>
      <span />
      {label}
    </div>
  );
}

export default TodaysRevenueScreen;
