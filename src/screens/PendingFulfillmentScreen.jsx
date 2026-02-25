import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./PendingFulfillmentScreen.css";

const TABS = [
  { key: "all", label: "All", count: 39 },
  { key: "new", label: "New", count: 28 },
  { key: "accepted", label: "Accepted", count: 2 },
  { key: "packed", label: "Packed", count: 9 },
];

const ORDERS = [
  {
    id: "#65440_24",
    urgent: true,
    orderedAgo: "1d 3h ago",
    dueDate: "1/15/2026, 11:58:23 PM",
    customerName: "Customer 25",
    customerPhone: "+355 670000024",
    customerAddress: "25, Street Name, City - 12345",
    productName: "Sample Product - M - Black",
    quantity: 1,
    price: "$2,285",
    earnings: "$1,942",
    status: "new",
  },
  {
    id: "#65440_23",
    urgent: true,
    orderedAgo: "1d 2h ago",
    dueDate: "1/16/2026, 12:58:23 AM",
    customerName: "Customer 24",
    customerPhone: "+355 670000023",
    customerAddress: "24, Street Name, City - 12345",
    productName: "Sample Product - M - Black",
    quantity: 1,
    price: "$3,887",
    earnings: "$3,304",
    status: "new",
  },
  {
    id: "#365440_6",
    urgent: false,
    orderedAgo: "9h 27m ago",
    dueDate: "1/16/2026, 5:58:23 PM",
    customerName: "Customer 7",
    customerPhone: "+355 670000006",
    customerAddress: "7, Street Name, City - 12345",
    productName: "Sample Product - M - Black",
    quantity: 2,
    price: "$1,887",
    earnings: "$1,604",
    status: "accepted",
  },
  {
    id: "#365440_3",
    urgent: false,
    orderedAgo: "6h 27m ago",
    dueDate: "1/16/2026, 8:58:23 PM",
    customerName: "Customer 4",
    customerPhone: "+355 670000003",
    customerAddress: "4, Street Name, City - 12345",
    productName: "Sample Product - M - Black",
    quantity: 2,
    price: "$1,958",
    earnings: "$1,664",
    status: "packed",
  },
];

function PendingFulfillmentScreen() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");

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

  const filteredOrders = selectedTab === "all" ? ORDERS : ORDERS.filter((order) => order.status === selectedTab);

  return (
    <SellerLayout selectedMenu="Orders" title="Pending Fulfillment" subtitle={formattedDate} contentClassName="no-pad">
      <main className="pending-content">
        <button type="button" className="pending-back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="pending-page-head">
          <div className="pending-page-icon">
            <img src="/icons/products.svg" alt="" />
          </div>
          <div>
            <h2>Pending Fulfillment</h2>
            <p>Orders awaiting processing, packing, or pickup</p>
          </div>
        </section>

        <section className="pending-stats-grid">
          <StatCard label="Total Pending" value="39" color="#F54900" />
          <StatCard label="New Orders" value="28" color="#155DFC" />
          <StatCard label="Accepted" value="2" color="#0092B8" />
          <StatCard label="Packed" value="9" color="#9810FA" />
        </section>

        <section className="pending-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`pending-tab ${selectedTab === tab.key ? "selected" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </section>

        <section className="pending-list">
          {filteredOrders.map((order) => (
            <article key={order.id} className={`pending-order-card ${order.urgent ? "urgent" : ""}`}>
              <div className="pending-order-main">
                <div className="pending-order-title-row">
                  <h3>Order {order.id}</h3>
                  <span className="badge new">NEW</span>
                  {order.urgent ? <span className="badge urgent">URGENT</span> : null}
                </div>

                <p className="pending-order-clock">
                  Ordered {order.orderedAgo} • <span>Due: {order.dueDate}</span>
                </p>

                <div className="pending-card-block">
                  <small>Customer</small>
                  <p>{order.customerName}</p>
                  <p>{order.customerPhone}</p>
                  <p>{order.customerAddress}</p>
                </div>

                <div className="pending-card-block blue">
                  <small>Items (1)</small>
                  <div className="pending-item-row">
                    <p>
                      {order.productName} x{order.quantity}
                    </p>
                    <strong>{order.price}</strong>
                  </div>
                </div>
              </div>

              <div className="pending-order-side">
                <p>Your Earnings</p>
                <h4>{order.earnings}</h4>
                <button type="button" className="dark-btn" onClick={() => window.alert(`Accepted ${order.id}`)}>
                  Accept Order
                </button>
                <button
                  type="button"
                  className="light-btn"
                  onClick={() =>
                    navigate("/order-details", {
                      state: {
                        orderNumber: `Order ${order.id}`,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        deliveryAddress: order.customerAddress,
                        earnings: Number(order.earnings.replace(/[$,]/g, "")),
                        subtotal: Number(order.price.replace(/[$,]/g, "")),
                        orderDate: new Date().toISOString(),
                        totalItems: Number(order.quantity),
                        paymentMethod: "Cash on Delivery",
                        isNewOrder: order.status === "new",
                        productName: order.productName,
                        productVariant: "Size: M, Color: Black",
                        sku: "SKU00001",
                      },
                    })
                  }
                >
                  View Details
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </SellerLayout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <article className="pending-stat-card">
      <p>{label}</p>
      <h3 style={{ color }}>{value}</h3>
    </article>
  );
}

export default PendingFulfillmentScreen;
