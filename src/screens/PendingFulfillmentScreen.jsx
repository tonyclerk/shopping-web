import { useMemo, useState } from "react";
import { serverTimestamp, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { useSellerOrders } from "../utils/orders";
import "./PendingFulfillmentScreen.css";

function formatDueDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatOrderedAgo(date) {
  if (!date) return "-";

  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours % 24}h ago`;
  if (hours > 0) return `${hours}h ${mins}m ago`;
  return `${Math.max(mins, 1)}m ago`;
}

function getFulfillmentStatus(order) {
  if (order.status === "pending") return "new";
  if (order.status === "accepted") return "accepted";
  if (order.status === "placed") return "packed";
  return null;
}

function getCustomerName(order) {
  return order.customerName ?? order.customer?.displayName ?? order.customer?.name ?? "Customer";
}

function getCustomerPhone(order) {
  return order.customerPhone ?? order.customer?.phone ?? order.phone ?? "-";
}

function getCustomerAddress(order) {
  return order.shippingAddress ?? order.deliveryAddress ?? order.customerAddress ?? "Address not available";
}

function getPrimaryItem(order) {
  return order.items?.[0] ?? {};
}

function getOrderViewModel(order) {
  const primaryItem = getPrimaryItem(order);
  const createdAt = order.createdAtDate ?? null;
  const dueDate = createdAt ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000) : new Date();
  const fulfillmentStatus = getFulfillmentStatus(order);

  return {
    ...order,
    fulfillmentStatus,
    urgent: createdAt ? Date.now() - createdAt.getTime() > 24 * 60 * 60 * 1000 && fulfillmentStatus === "new" : false,
    orderedAgo: formatOrderedAgo(createdAt),
    dueDate: formatDueDate(dueDate),
    customerName: getCustomerName(order),
    customerPhone: getCustomerPhone(order),
    customerAddress: getCustomerAddress(order),
    productName: primaryItem.title ?? "Product",
    quantity: order.quantitySold || primaryItem.quantity || 0,
    price: `$${Number(order.finalPaidAmount ?? 0).toFixed(2)}`,
    earnings: `$${Number(order.finalPaidAmount ?? 0).toFixed(2)}`,
    productVariant: [primaryItem.size ? `Size: ${primaryItem.size}` : null, primaryItem.color ? `Color: ${primaryItem.color}` : null]
      .filter(Boolean)
      .join(", "),
    sku: primaryItem.sku ?? "SKU00001",
    image: primaryItem.image ?? "",
    paymentMethod: order.paymentMethod ?? "Cash on Delivery",
  };
}

function PendingFulfillmentScreen() {
  const navigate = useNavigate();
  const { orders, loading } = useSellerOrders();
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

  const pendingOrders = useMemo(
    () =>
      orders
        .filter((order) => !["delivered", "cancelled"].includes(order.status))
        .map(getOrderViewModel)
        .filter((order) => order.fulfillmentStatus),
    [orders],
  );

  const counts = useMemo(
    () => ({
      all: pendingOrders.length,
      new: pendingOrders.filter((order) => order.fulfillmentStatus === "new").length,
      accepted: pendingOrders.filter((order) => order.fulfillmentStatus === "accepted").length,
      packed: pendingOrders.filter((order) => order.fulfillmentStatus === "packed").length,
    }),
    [pendingOrders],
  );

  const tabs = useMemo(
    () => [
      { key: "all", label: "All", count: counts.all },
      { key: "new", label: "New", count: counts.new },
      { key: "accepted", label: "Accepted", count: counts.accepted },
      { key: "packed", label: "Packed", count: counts.packed },
    ],
    [counts],
  );

  const filteredOrders = useMemo(
    () => (selectedTab === "all" ? pendingOrders : pendingOrders.filter((order) => order.fulfillmentStatus === selectedTab)),
    [pendingOrders, selectedTab],
  );

  const updateStatus = async (order, nextStatus) => {
    try {
      await updateDoc(order.ref, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Pending fulfillment update failed:", error);
      window.alert("Failed to update order status.");
    }
  };

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
          <StatCard label="Total Pending" value={String(counts.all)} color="#F54900" />
          <StatCard label="New Orders" value={String(counts.new)} color="#155DFC" />
          <StatCard label="Accepted" value={String(counts.accepted)} color="#0092B8" />
          <StatCard label="Packed" value={String(counts.packed)} color="#9810FA" />
        </section>

        <section className="pending-tabs">
          {tabs.map((tab) => (
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
          {loading ? (
            <article className="pending-order-card">
              <div className="pending-order-main">
                <h3>Loading pending orders...</h3>
              </div>
            </article>
          ) : filteredOrders.length ? (
            filteredOrders.map((order) => (
              <article key={order.id} className={`pending-order-card ${order.urgent ? "urgent" : ""}`}>
                <div className="pending-order-main">
                  <div className="pending-order-title-row">
                    <h3>Order {order.orderNumber ?? order.id}</h3>
                    <span className={`badge ${order.fulfillmentStatus}`}>{order.fulfillmentStatus.toUpperCase()}</span>
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
                    <small>Items ({order.items.length})</small>
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

                  {order.fulfillmentStatus === "new" ? (
                    <button type="button" className="dark-btn" onClick={() => updateStatus(order, "accepted")}>
                      Accept Order
                    </button>
                  ) : null}

                  {order.fulfillmentStatus === "accepted" ? (
                    <button type="button" className="dark-btn" onClick={() => updateStatus(order, "placed")}>
                      Mark Packed
                    </button>
                  ) : null}

                  {order.fulfillmentStatus === "packed" ? (
                    <button type="button" className="dark-btn" onClick={() => updateStatus(order, "delivered")}>
                      Mark Delivered
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="light-btn"
                    onClick={() =>
                      navigate("/order-details", {
                        state: {
                          orderNumber: order.orderNumber ?? order.id,
                          customerName: order.customerName,
                          customerPhone: order.customerPhone,
                          deliveryAddress: order.customerAddress,
                          earnings: Number(order.finalPaidAmount ?? 0),
                          subtotal: Number(order.finalPaidAmount ?? 0),
                          orderDate: order.createdAtDate?.toISOString?.() ?? new Date().toISOString(),
                          totalItems: Number(order.quantity),
                          paymentMethod: order.paymentMethod,
                          isNewOrder: order.fulfillmentStatus === "new",
                          productName: order.productName,
                          productVariant: order.productVariant || "Variant not available",
                          sku: order.sku,
                        },
                      })
                    }
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))
          ) : (
            <article className="pending-order-card">
              <div className="pending-order-main">
                <h3>No pending orders</h3>
                <p>Orders that are not completed will appear here.</p>
              </div>
            </article>
          )}
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
