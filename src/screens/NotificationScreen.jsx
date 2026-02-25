import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./NotificationScreen.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    title: "New Order Received",
    message: "Order #ORD-2024-001 has been placed. Please accept within 2 hours.",
    time: "5m ago",
    type: "orders",
    unread: true,
    isNew: true,
  },
  {
    id: "n2",
    title: "Settlement Processed",
    message: "Your weekly settlement of $4,250 has been processed and will be credited within 2-3 business days.",
    time: "2h ago",
    type: "payments",
    unread: true,
    isNew: true,
  },
  {
    id: "n3",
    title: "Low Stock Alert",
    message: "5 products are running low on stock. Please restock to avoid order cancellations.",
    time: "5h ago",
    type: "inventory",
    unread: false,
    isNew: false,
  },
  {
    id: "n4",
    title: "Product Approved",
    message: "Your product \"Premium Leather Wallet\" has been approved and is now live.",
    time: "1d ago",
    type: "products",
    unread: false,
    isNew: false,
  },
  {
    id: "n5",
    title: "SLA Reminder",
    message: "You have 3 orders that need to be packed within the next 4 hours.",
    time: "2d ago",
    type: "orders",
    unread: false,
    isNew: false,
  },
];

function NotificationScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState("all");

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

  const unreadCount = notifications.filter((item) => item.unread).length;
  const filteredNotifications = activeFilter === "unread" ? notifications.filter((item) => item.unread) : notifications;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const openNotification = (item) => {
    setNotifications((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)));

    if (item.type === "orders") navigate("/orders");
    else if (item.type === "inventory") navigate("/low-stock-alerts");
    else if (item.type === "payments") navigate("/payments");
    else if (item.type === "returns") navigate("/returns-management");
    else if (item.type === "products") navigate("/products");
  };

  const markOneRead = (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  };

  const deleteOne = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SellerLayout selectedMenu="Dashboard" title="Notifications" subtitle={formattedDate} contentClassName="no-pad">
      <main className="notif-content">
        <section className="notif-head">
          <div>
            <h2>Notifications</h2>
            <p>Stay updated with your business activities</p>
          </div>
          <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </button>
        </section>

        <section className="notif-filters">
          <button type="button" className={activeFilter === "all" ? "active" : ""} onClick={() => setActiveFilter("all")}>
            All ({notifications.length})
          </button>
          <button type="button" className={activeFilter === "unread" ? "active" : ""} onClick={() => setActiveFilter("unread")}>
            Unread ({unreadCount})
          </button>
        </section>

        <section className="notif-list">
          {filteredNotifications.map((item) => (
            <article
              key={item.id}
              className={`notif-item ${item.unread ? "unread" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => openNotification(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openNotification(item);
                }
              }}
            >
              <div className={`notif-icon ${item.type}`}>
                <img src={`/icons/${item.type === "products" ? "products" : item.type}.svg`} alt="" />
              </div>
              <div className="notif-main">
                <div className="notif-title-row">
                  <div className="notif-title-left">
                    <h3>{item.title}</h3>
                    {item.isNew ? <span className="new-pill">New</span> : null}
                  </div>
                </div>
                <p>{item.message}</p>
                <small>{item.time}</small>
              </div>
              <div className="notif-actions" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="read-btn" onClick={() => markOneRead(item.id)} aria-label="Mark as read">
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className="delete-btn" onClick={() => deleteOne(item.id)} aria-label="Delete notification">
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M3 6h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 6V4h8v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 6l-1 14H6L5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 11v6M14 11v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </SellerLayout>
  );
}

export default NotificationScreen;
