import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./ReturnsManagementScreen.css";

const TABS = [
  { key: "pending", label: "Pending", count: 1 },
  { key: "accepted", label: "Accepted", count: 2 },
  { key: "rejected", label: "Rejected", count: 0 },
  { key: "completed", label: "Completed", count: 0 },
];

function ReturnsManagementScreen() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("pending");

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
    <SellerLayout selectedMenu="Returns" title="Returns" subtitle={formattedDate} contentClassName="no-pad">
      <main className="returns-mgmt-content">
        <button type="button" className="back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="mgmt-title-wrap">
          <div className="mgmt-title-icon">
            <img src="/icons/returns.svg" alt="" />
          </div>
          <h2>Returns Management</h2>
        </section>

        <section className="mgmt-stats-grid">
          <StatCard label="Total Returns" value="3" />
          <StatCard label="Pending" value="1" highlight />
          <StatCard label="Accepted" value="2" />
          <StatCard label="Rejected" value="0" />
        </section>

        <section className="mgmt-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`mgmt-tab ${selectedTab === tab.key ? "selected" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </section>

        <section className="return-card">
          {selectedTab === "pending" || selectedTab === "accepted" ? (
            <>
              <div className="return-card-head">
                <h3>Return #365440_0</h3>
                <span className="requested-pill">REQUESTED</span>
              </div>
              <div className="return-chip-row">
                <span className="chip">Defective Product</span>
                <small>Requested Today</small>
              </div>

              <InfoBox label="Original Order" content="#365440 • Placed on Dec 15, 2024" tone="blue" />
              <InfoBox
                label="Return Reason"
                content="Product received is damaged and not working properly. The screen has scratches and the device won't turn on."
                tone="red"
              />
              <InfoBox label="Items to Return" content="1x iPhone 15 Pro Max 256GB - Natural Titanium" tone="blue" />

              <p className="return-value-label">Return Value</p>
              <p className="return-value">$2,360</p>

              <div className="return-actions">
                <button type="button" className="accept-btn">Accept Return</button>
                <button type="button" className="reject-btn">Reject Return</button>
                <button type="button" className="view-btn">View Order</button>
              </div>
            </>
          ) : (
            <p className="empty-text">No returns in this category</p>
          )}
        </section>

        <section className="policy-box">
          <h4>Return Policy Guidelines</h4>
          <ul>
            <li>Returns must be approved within 48 hours of request</li>
            <li>Refund will be processed within 5-7 business days after approval</li>
            <li>Products must be in original condition with all accessories</li>
            <li>Return shipping costs are covered for defective products</li>
          </ul>
        </section>
      </main>
    </SellerLayout>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <article className={`mgmt-stat-card ${highlight ? "highlight" : ""}`}>
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

function InfoBox({ label, content, tone }) {
  return (
    <article className={`info-box ${tone}`}>
      <small>{label}</small>
      <p>{content}</p>
    </article>
  );
}

export default ReturnsManagementScreen;
