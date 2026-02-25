import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReturnsScreen.css";

const MENU_ITEMS = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "products", label: "Products" },
  { icon: "inventory", label: "Inventory" },
  { icon: "orders", label: "Orders" },
  { icon: "payments", label: "Payments" },
  { icon: "returns", label: "Returns" },
];

const INITIAL_PENDING_RETURNS = [
  {
    returnId: "#096617_0",
    orderId: "#096617_0",
    customer: "cust_0",
    reason: "Defective Product",
    reasonDetail: "Product not as expected",
    amount: 2360,
    requestedDate: "1/18/2026",
  },
];

const INITIAL_RETURN_HISTORY = [
  {
    returnId: "#096617_1",
    orderId: "#096617_1",
    reason: "Wrong Item Sent",
    amount: 2360,
    status: "accepted",
    response: "Return approved",
    date: "1/17/2026",
  },
  {
    returnId: "#096617_2",
    orderId: "#096617_2",
    reason: "Not as Described",
    amount: 2360,
    status: "accepted",
    response: "Return approved",
    date: "1/16/2026",
  },
];

function ReturnsScreen() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingReturns, setPendingReturns] = useState(INITIAL_PENDING_RETURNS);
  const [returnHistory, setReturnHistory] = useState(INITIAL_RETURN_HISTORY);

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

  const acceptedCount = useMemo(
    () => returnHistory.filter((item) => item.status === "accepted").length,
    [returnHistory],
  );
  const rejectedCount = useMemo(
    () => returnHistory.filter((item) => item.status === "rejected").length,
    [returnHistory],
  );

  const handleMenuSelect = (label) => {
    setMobileNavOpen(false);

    if (label === "Dashboard") {
      navigate("/dashboard");
      return;
    }
    if (label === "Products") {
      navigate("/products");
      return;
    }
    if (label === "Inventory") {
      navigate("/inventory");
      return;
    }
    if (label === "Orders") {
      navigate("/orders");
      return;
    }
    if (label === "Payments") {
      navigate("/payments");
      return;
    }
    if (label === "Returns") return;

    window.alert(`${label} screen is not ported yet.`);
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    navigate("/login", { replace: true });
  };

  const updateReturnStatus = (item, status) => {
    setPendingReturns((prev) => prev.filter((row) => row.returnId !== item.returnId));
    setReturnHistory((prev) => [
      {
        returnId: item.returnId,
        orderId: item.orderId,
        reason: item.reason,
        amount: item.amount,
        status,
        response: status === "accepted" ? "Return approved" : "Return rejected",
        date: new Intl.DateTimeFormat("en-US").format(new Date()),
      },
      ...prev,
    ]);
  };

  return (
    <div className="returns-shell">
      <button type="button" className="returns-mobile-menu" onClick={() => setMobileNavOpen((v) => !v)}>
        Menu
      </button>

      <aside className={`returns-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="returns-sidebar-header">
          <div className="returns-brand-icon">
            <img src="/icons/shopping_cart.svg" alt="Brand" />
          </div>
          <div>
            <p className="returns-brand-code">0000000</p>
            <p className="returns-brand-name">Seller Portal</p>
          </div>
        </div>

        <nav className="returns-nav">
          {MENU_ITEMS.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`returns-nav-item ${item.label === "Returns" ? "selected" : ""}`}
              onClick={() => handleMenuSelect(item.label)}
            >
              <img src={`/icons/${item.icon}.svg`} alt="" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="returns-sidebar-footer">
          <div className="returns-profile-row">
            <div className="returns-profile-avatar">0</div>
            <div>
              <p className="returns-profile-name">0000000</p>
              <p className="returns-profile-id">00000000000000</p>
            </div>
          </div>
          <button type="button" className="returns-logout-btn" onClick={handleLogout}>
            <img src="/icons/logout.svg" alt="" />
            Logout
          </button>
        </div>
      </aside>

      <section className="returns-main">
        <header className="returns-header">
          <div>
            <h1>Returns</h1>
            <p>{formattedDate}</p>
          </div>
          <button type="button" className="returns-notification-btn" aria-label="Notifications">
            <img src="/icons/bell.svg" alt="" />
          </button>
        </header>

        <main className="returns-content">
          <section>
            <h2 className="returns-page-title">Returns Management</h2>
            <p className="returns-page-subtitle">Handle customer return requests</p>
            <button type="button" className="returns-mgmt-link" onClick={() => navigate("/returns-management")}>
              Open Detailed Returns Management
            </button>
          </section>

          <section className="returns-stats-grid">
            <StatCard label="Pending Returns" value={`${pendingReturns.length}`} tone="warning" />
            <StatCard label="Accepted" value={`${acceptedCount}`} tone="success" />
            <StatCard label="Rejected" value={`${rejectedCount}`} tone="danger" />
          </section>

          <section className="returns-card">
            <h3>Pending Return Requests</h3>
            <div className="returns-table-wrap">
              <table className="returns-table">
                <thead>
                  <tr>
                    <th>Return ID</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Requested Date</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReturns.map((item) => (
                    <tr key={item.returnId}>
                      <td>{item.returnId}</td>
                      <td>{item.orderId}</td>
                      <td>{item.customer}</td>
                      <td>
                        <div className="reason-wrap">
                          <span className="reason-badge">{item.reason}</span>
                          <small>{item.reasonDetail}</small>
                        </div>
                      </td>
                      <td>${item.amount.toFixed(0)}</td>
                      <td>{item.requestedDate}</td>
                      <td className="align-right">
                        <button
                          type="button"
                          className="action-btn accept"
                          onClick={() => updateReturnStatus(item, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="action-btn reject"
                          onClick={() => updateReturnStatus(item, "rejected")}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingReturns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-row">
                        No pending return requests
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="returns-card">
            <h3>Return History</h3>
            <div className="returns-table-wrap">
              <table className="returns-table">
                <thead>
                  <tr>
                    <th>Return ID</th>
                    <th>Order ID</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Response</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returnHistory.map((item) => (
                    <tr key={`${item.returnId}-${item.date}`}>
                      <td>{item.returnId}</td>
                      <td>{item.orderId}</td>
                      <td>
                        <span className="reason-badge">{item.reason}</span>
                      </td>
                      <td>${item.amount.toFixed(0)}</td>
                      <td>
                        <span className={`history-status ${item.status}`}>{item.status}</span>
                      </td>
                      <td>{item.response}</td>
                      <td>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <article className="returns-stat-card">
      <div className={`returns-stat-icon ${tone}`}>R</div>
      <div>
        <p>{label}</p>
        <h4>{value}</h4>
      </div>
    </article>
  );
}

export default ReturnsScreen;
