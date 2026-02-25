import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./OrderDetailsScreen.css";

const FALLBACK_ORDER = {
  orderNumber: "Order #96851178",
  customerName: "New Customer 259",
  customerPhone: "+1 234 567 8900",
  deliveryAddress: "123 Main St, Apt 4B, New York, NY 10001",
  earnings: 1805,
  subtotal: 2124,
  orderDate: new Date().toISOString(),
  totalItems: 1,
  paymentMethod: "Credit Card",
  isNewOrder: true,
  productName: "Premium Cotton T-Shirt",
  productVariant: "Size: L, Color: Blue",
  sku: "TS-001",
};

const TIMELINE_STEPS = [
  { label: "Order Placed", completed: true },
  { label: "Order Accepted", completed: false },
  { label: "Order Packed", completed: false },
  { label: "Picked Up by Courier", completed: false },
  { label: "Delivered", completed: false },
];

function OrderDetailsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = { ...FALLBACK_ORDER, ...(location.state ?? {}) };

  const orderDate = new Date(order.orderDate);
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

  const tax = order.subtotal * 0.1;
  const shipping = 5;
  const total = order.subtotal + tax + shipping;
  const commission = total * 0.15;
  const netEarnings = total - commission;

  return (
    <SellerLayout selectedMenu="Orders" title="Order Details" subtitle={formattedDate} contentClassName="no-pad">
      <main className="order-details-content">
        <section className="order-details-top-row">
          <button type="button" className="order-back-btn" onClick={() => navigate(-1)}>
            <span aria-hidden="true">←</span>
            Back
          </button>

          <div className="order-top-actions">
            <button type="button" className="order-action-btn" onClick={() => window.alert(`Downloading invoice for ${order.orderNumber}`)}>
              Download Invoice
            </button>
            <button type="button" className="order-action-btn" onClick={() => window.alert(`Calling ${order.customerPhone}`)}>
              Contact Customer
            </button>
          </div>
        </section>

        <section className="order-header-card">
          <div className="order-header-title-row">
            <h2>{order.orderNumber}</h2>
            {order.isNewOrder ? <span className="new-pill">NEW</span> : null}
          </div>
          <p>
            Placed on{" "}
            {new Intl.DateTimeFormat("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(orderDate)}
          </p>
          <div className="earnings-banner">
            <p>Your Earnings:</p>
            <strong>${Number(order.earnings).toFixed(2)}</strong>
          </div>
        </section>

        {order.isNewOrder ? (
          <section className="accept-banner">
            <div className="accept-banner-message">
              <span aria-hidden="true">i</span>
              <p>This order is awaiting your acceptance</p>
            </div>
            <button type="button" onClick={() => window.alert(`Accepted ${order.orderNumber}`)}>
              Accept Order
            </button>
          </section>
        ) : null}

        <section className="order-main-grid">
          <div className="order-left-col">
            <article className="detail-card">
              <h3>Order Timeline</h3>
              <div className="timeline-list">
                {TIMELINE_STEPS.map((step, index) => (
                  <div key={step.label} className="timeline-row">
                    <div className="timeline-marker">
                      <span className={step.completed ? "done" : ""}>{step.completed ? "\u2713" : ""}</span>
                      {index < TIMELINE_STEPS.length - 1 ? <i /> : null}
                    </div>
                    <div>
                      <p className={`timeline-label ${step.completed ? "done" : ""}`}>{step.label}</p>
                      {step.completed ? <small>{new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(orderDate)}</small> : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="detail-card">
              <h3>Order Items</h3>
              <div className="item-row">
                <div className="item-thumb">IMG</div>
                <div className="item-info">
                  <h4>{order.productName}</h4>
                  <div className="item-badges">
                    <span>SKU: {order.sku}</span>
                    <span>{order.productVariant}</span>
                  </div>
                  <div className="item-foot">
                    <p>Quantity: {order.totalItems}</p>
                    <strong>${(order.subtotal / Math.max(order.totalItems, 1)).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </article>

            <article className="detail-card">
              <h3>Payment Breakdown</h3>
              <PriceRow label="Subtotal" value={order.subtotal} />
              <PriceRow label="Shipping" value={shipping} />
              <PriceRow label="Tax (10%)" value={tax} />
              <hr />
              <PriceRow label="Order Total" value={total} bold />
              <div className="commission-box">
                <PriceRow label="Platform Commission (15%)" value={commission} danger />
                <hr />
                <PriceRow label="Your Earnings" value={netEarnings} bold success />
              </div>
            </article>
          </div>

          <div className="order-right-col">
            <article className="detail-card">
              <h3>Customer Details</h3>
              <InfoRow icon="products" label="Name" value={order.customerName} />
              <InfoRow icon="orders" label="Phone" value={order.customerPhone} />
              <InfoRow icon="inventory" label="Delivery Address" value={order.deliveryAddress} />
            </article>

            <article className="detail-card">
              <h3>Order Summary</h3>
              <SummaryRow label="Order ID" value={order.orderNumber} />
              <SummaryRow label="Order Date" value={new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(orderDate)} />
              <SummaryRow label="Order Time" value={new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(orderDate)} />
              <SummaryRow label="Total Items" value={String(order.totalItems)} />
              <SummaryRow label="Payment Method" value={order.paymentMethod} />
            </article>
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

function PriceRow({ label, value, bold = false, success = false, danger = false }) {
  return (
    <div className="price-row">
      <span className={`price-label ${bold ? "bold" : ""}`.trim()}>{label}</span>
      <strong className={`${bold ? "bold" : ""} ${success ? "success" : ""} ${danger ? "danger" : ""}`.trim()}>${Number(value).toFixed(2)}</strong>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="info-row-card">
      <img src={`/icons/${icon}.svg`} alt="" />
      <div>
        <small>{label}</small>
        <p>{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default OrderDetailsScreen;
