import { useMemo, useState } from "react";
import SellerLayout from "../components/SellerLayout.jsx";
import "./OrderManagementScreen.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "packed", label: "Packed" },
  { key: "picked up", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

const INITIAL_ORDERS = [
  { id: "#096617_0", date: "1/18/2026, 4:31:56 PM", customer: "Customer 1", phone: "+355 670000000", items: "1 item(s)", amount: "$5,513", earnings: "$3,971", status: "accepted", sla: null },
  { id: "#096617_1", date: "1/18/2026, 3:31:56 PM", customer: "Customer 2", phone: "+355 670000001", items: "1 item(s)", amount: "$2,015", earnings: "$1,452", status: "new", sla: "overdue" },
  { id: "#096617_2", date: "1/18/2026, 2:31:56 PM", customer: "Customer 3", phone: "+355 670000002", items: "1 item(s)", amount: "$5,945", earnings: "$4,282", status: "new", sla: "overdue" },
  { id: "#096617_3", date: "1/18/2026, 1:31:56 PM", customer: "Customer 4", phone: "+355 670000003", items: "1 item(s)", amount: "$5,087", earnings: "$3,664", status: "delivered", sla: null },
  { id: "#096617_4", date: "1/18/2026, 12:31:56 PM", customer: "Customer 5", phone: "+355 670000004", items: "1 item(s)", amount: "$6,825", earnings: "$4,916", status: "picked up", sla: null },
  { id: "#096617_5", date: "1/18/2026, 11:31:56 AM", customer: "Customer 6", phone: "+355 670000005", items: "1 item(s)", amount: "$3,230", earnings: "$2,326", status: "packed", sla: null },
  { id: "#096617_6", date: "1/18/2026, 10:31:56 AM", customer: "Customer 7", phone: "+355 670000006", items: "1 item(s)", amount: "$1,515", earnings: "$1,091", status: "new", sla: "overdue" },
  { id: "#096617_7", date: "1/18/2026, 9:31:56 AM", customer: "Customer 8", phone: "+355 670000007", items: "1 item(s)", amount: "$6,654", earnings: "$4,793", status: "delivered", sla: null },
  { id: "#096617_8", date: "1/18/2026, 8:31:56 AM", customer: "Customer 9", phone: "+355 670000008", items: "1 item(s)", amount: "$5,299", earnings: "$3,817", status: "packed", sla: null },
  { id: "#096617_9", date: "1/18/2026, 7:31:56 AM", customer: "Customer 10", phone: "+355 670000009", items: "1 item(s)", amount: "$2,628", earnings: "$1,893", status: "accepted", sla: null },
];

const STATUS_STYLE = {
  new: { background: "#FEF9C2", color: "#894B00" },
  accepted: { background: "#DBEAFE", color: "#193CB8" },
  packed: { background: "#F3E8FF", color: "#6E11B0" },
  "picked up": { background: "#E0E7FF", color: "#372AAC" },
  delivered: { background: "#DCFCE7", color: "#016630" },
};

function OrderManagementScreen() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()),
    [],
  );

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length, new: 0, accepted: 0, packed: 0, "picked up": 0, delivered: 0 };
    orders.forEach((order) => {
      counts[order.status] += 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (selectedTab === "all") return orders;
    return orders.filter((order) => order.status === selectedTab);
  }, [orders, selectedTab]);

  const patchOrderStatus = (orderId, nextStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus, sla: null } : order)));
  };

  const renderActions = (order) => {
    if (order.status === "new") {
      return (
        <>
          <button type="button" className="order-action dark" onClick={() => patchOrderStatus(order.id, "accepted")}>
            Accept
          </button>
          <button type="button" className="order-action reject" onClick={() => window.alert(`Rejected ${order.id}`)}>
            Reject
          </button>
        </>
      );
    }

    if (order.status === "accepted") {
      return (
        <button type="button" className="order-action dark" onClick={() => patchOrderStatus(order.id, "packed")}>
          Mark Packed
        </button>
      );
    }

    if (order.status === "packed") {
      return (
        <button type="button" className="order-action dark" onClick={() => patchOrderStatus(order.id, "picked up")}>
          Picked Up
        </button>
      );
    }

    return null;
  };

  return (
    <SellerLayout selectedMenu="Orders" title="Orders" subtitle={formattedDate} contentClassName="no-pad">
      <main className="order-content">
        <section>
          <h2 className="order-page-title">Order Management</h2>
          <p className="order-page-subtitle">Track and fulfill customer orders</p>
        </section>

        <section className="order-tabs">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={`order-tab ${tab.key === selectedTab ? "selected" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label} ({tabCounts[tab.key]})
            </button>
          ))}
        </section>

        <section className="order-table-wrap">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Your Earnings</th>
                <th>Status</th>
                <th>SLA</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusStyle = STATUS_STYLE[order.status] ?? { background: "#ECECF0", color: "#0A0A0A" };

                return (
                  <tr key={order.id}>
                    <td>
                      <p className="order-id">{order.id}</p>
                      <p className="order-date">{order.date}</p>
                    </td>
                    <td>
                      <p className="order-id">{order.customer}</p>
                      <p className="order-date">{order.phone}</p>
                    </td>
                    <td>{order.items}</td>
                    <td>{order.amount}</td>
                    <td className="earnings">{order.earnings}</td>
                    <td>
                      <span className="order-status" style={{ backgroundColor: statusStyle.background, color: statusStyle.color }}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.sla ? <span className="sla-badge">Clock {order.sla}</span> : null}</td>
                    <td className="align-right action-cell">
                      <button type="button" className="order-view-btn" aria-label={`View ${order.id}`} onClick={() => setSelectedOrder(order)}>
                        View
                      </button>
                      {renderActions(order)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>

      {selectedOrder ? <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
    </SellerLayout>
  );
}

function OrderDetailsModal({ order, onClose }) {
  const subtotal = Number(order.amount.replace(/[$,]/g, ""));
  const tax = subtotal * 0.18;
  const commission = subtotal * 0.15;
  const earnings = Number(order.earnings.replace(/[$,]/g, ""));

  return (
    <div className="order-detail-modal-overlay" onClick={onClose} role="presentation">
      <section className="order-detail-modal" role="dialog" aria-modal="true" aria-label="Order Details" onClick={(event) => event.stopPropagation()}>
        <header className="order-detail-modal-head">
          <h3>Order Details</h3>
          <button type="button" aria-label="Close details" onClick={onClose}>
            ×
          </button>
        </header>

        <p className="order-detail-id-label">Order</p>
        <p className="order-detail-id">{order.id}</p>

        <div className="order-detail-info-grid">
          <article>
            <h4>Customer Information</h4>
            <p>
              <strong>Name:</strong> {order.customer}
            </p>
            <p>
              <strong>Phone:</strong> {order.phone}
            </p>
            <p>
              <strong>Address:</strong> 1, Street Name, City - 12345
            </p>
          </article>

          <article>
            <h4>Order Information</h4>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Order Date:</strong> {order.date}
            </p>
          </article>
        </div>

        <h4 className="order-detail-items-title">Order Items</h4>
        <article className="order-detail-item-card">
          <div className="order-detail-item-thumb">
            <img src="/icons/products.svg" alt="" />
          </div>
          <div className="order-detail-item-copy">
            <p className="item-title">Sample Product</p>
            <p>SKU: SKU0001 | Size: M | Color: Black</p>
            <p>Quantity: 3</p>
          </div>
          <p className="order-detail-item-price">${subtotal.toLocaleString("en-US")}</p>
        </article>

        <div className="order-detail-price-list">
          <PriceLine label="Subtotal" value={subtotal} />
          <PriceLine label="Tax (18%)" value={tax} />
          <PriceLine label="Commission (15%)" value={-commission} negative />
        </div>
        <footer className="order-detail-earnings-row">
          <p>Your Earnings</p>
          <strong>${earnings.toLocaleString("en-US")}</strong>
        </footer>
      </section>
    </div>
  );
}

function PriceLine({ label, value, negative = false }) {
  return (
    <div className="order-detail-price-line">
      <span className={negative ? "negative" : ""}>{label}</span>
      <span className={negative ? "negative" : ""}>
        {negative ? "-" : ""}${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

export default OrderManagementScreen;
