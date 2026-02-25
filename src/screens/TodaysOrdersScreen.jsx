import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./TodaysOrdersScreen.css";

const SUMMARY = [
  { label: "Total Orders", value: "24", color: "#155DFC" },
  { label: "Total Revenue", value: "$61,384", color: "#00A63E" },
  { label: "Average Order Value", value: "$2,558", color: "#155DFC" },
];

const ORDERS = [
  { id: "Order #96851178", customer: "New Customer 259", items: "1 item", time: "2:24:11 AM", product: "Running Shoes - M - Black", qty: 1, subtotal: "$2,124", earnings: "$1,805" },
  { id: "Order #96131170", customer: "New Customer 258", items: "1 item", time: "2:12:11 AM", product: "Running Shoes - M - Black", qty: 2, subtotal: "$4,248", earnings: "$3,611" },
  { id: "Order #95893173", customer: "New Customer 556", items: "1 item", time: "2:08:13 AM", product: "Smart Watch Pro - Black", qty: 1, subtotal: "$2,124", earnings: "$1,805" },
  { id: "Order #95772174", customer: "New Customer 338", items: "1 item", time: "2:06:12 AM", product: "Smart Watch Pro - Black", qty: 1, subtotal: "$2,124", earnings: "$1,805" },
];

function TodaysOrdersScreen() {
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
    <SellerLayout selectedMenu="Dashboard" title="Today's Orders" subtitle={formattedDate} contentClassName="no-pad">
      <main className="today-orders-content">
        <button type="button" className="today-orders-back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="today-orders-header">
          <div className="today-orders-icon-wrap">
            <img src="/icons/orders.svg" alt="" />
          </div>
          <div>
            <h2>Today&apos;s Orders</h2>
            <p>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}</p>
          </div>
        </section>

        <section className="today-orders-summary-grid">
          {SUMMARY.map((card) => (
            <article key={card.label} className="today-orders-summary-card">
              <p>{card.label}</p>
              <h3 style={{ color: card.color }}>{card.value}</h3>
            </article>
          ))}
        </section>

        <section className="today-orders-list-card">
          <div className="today-orders-list-head">
            <div>
              <h3>All Orders (24)</h3>
              <p>Complete list of today&apos;s orders</p>
            </div>
            <button type="button">Export</button>
          </div>

          <div className="today-orders-list">
            {ORDERS.map((order) => (
              <article key={order.id} className="today-order-item">
                <div className="today-order-main">
                  <div className="today-order-top-row">
                    <h4>{order.id}</h4>
                    <span>NEW</span>
                  </div>
                  <div className="today-order-meta-row">
                    <p>Customer: {order.customer}</p>
                    <p>Items: {order.items}</p>
                  </div>
                  <p className="today-order-time">Time: {order.time}</p>
                  <div className="today-order-product">
                    <p>
                      {order.product} x{order.qty}
                    </p>
                    <strong>{order.subtotal}</strong>
                  </div>
                </div>

                <div className="today-order-earnings">
                  <p>Your Earnings</p>
                  <h5>{order.earnings}</h5>
                  <div className="today-order-breakdown">
                    <span>Subtotal: {order.subtotal}</span>
                    <span>Tax: $382</span>
                    <span className="negative">Commission: -$319</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/order-details", {
                        state: {
                          orderNumber: order.id,
                          customerName: order.customer,
                          customerPhone: "+1 234 567 8900",
                          deliveryAddress: "123 Main St, Apt 4B, New York, NY 10001",
                          earnings: Number(order.earnings.replace(/[$,]/g, "")),
                          subtotal: Number(order.subtotal.replace(/[$,]/g, "")),
                          orderDate: new Date().toISOString(),
                          totalItems: Number(order.qty),
                          paymentMethod: "Credit Card",
                          isNewOrder: true,
                          productName: order.product,
                          productVariant: "Size: L, Color: Blue",
                          sku: "TS-001",
                        },
                      })
                    }
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

export default TodaysOrdersScreen;
