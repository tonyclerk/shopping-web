import { useMemo, useState, useEffect } from "react";
import {
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import SellerLayout from "../components/SellerLayout.jsx";
import "./OrderManagementScreen.css";

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "placed", label: "Placed" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLE = {
  pending: { background: "#FEF3C7", color: "#92400E" },
  accepted: { background: "#DBEAFE", color: "#1D4ED8" },
  placed: { background: "#EDE9FE", color: "#6D28D9" },
  shipped: { background: "#E0F2FE", color: "#075985" },
  delivered: { background: "#DCFCE7", color: "#166534" },
  cancelled: { background: "#FEE2E2", color: "#B91C1C" },
};

const ACTION_CONFIG = {
  pending: [
    { status: "accepted", label: "Accept", tone: "dark" },
    { status: "cancelled", label: "Reject", tone: "reject" },
  ],
  accepted: [{ status: "placed", label: "Order Placed", tone: "dark", icon: "box" }],
  placed: [{ status: "delivered", label: "Delivered", tone: "dark", icon: "pickup" }],
};

const STATUS_ALIASES = {
  new: "pending",
  confirmed: "accepted",
  packed: "placed",
  picked_up: "placed",
};

const formatDate = (ts) => {
  if (!ts) return "-";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatStatusLabel = (status) => {
  if (!status) return "-";
  return status.replace(/_/g, " ");
};

const normalizeStatus = (status) => STATUS_ALIASES[status] ?? status ?? "pending";

const getNonEmptyString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const getCustomerName = (customer) =>
  getNonEmptyString(customer?.displayName, customer?.name, customer?.fullName, customer?.username);

const getCustomerEmail = (customer) => getNonEmptyString(customer?.email, customer?.mail);

const getCustomerId = (order) =>
  getNonEmptyString(
    order.userId,
    order.customerId,
    order.uid,
    order.user?.uid,
    order.customer?.uid,
    order.customerUid,
  );

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 7 12 11l7.5-4M12 11v10" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PickupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 7.5A1.5 1.5 0 0 1 4.5 6H14l3 3H19.5A1.5 1.5 0 0 1 21 10.5v5A1.5 1.5 0 0 1 19.5 17H18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 9h8v8H4.5A1.5 1.5 0 0 1 3 15.5v-6Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7" cy="18" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="18" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ActionIcon({ icon }) {
  if (icon === "box") return <BoxIcon />;
  if (icon === "pickup") return <PickupIcon />;
  return null;
}

function ActionButtons({ order, onView, onUpdateStatus, showView = true }) {
  const actions = ACTION_CONFIG[normalizeStatus(order.status)] ?? [];

  return (
    <div className="order-actions">
      {showView ? (
        <button
          type="button"
          className="order-icon-btn"
          aria-label={`View order ${order.orderNumber ?? order.id}`}
          onClick={() => onView(order)}
        >
          <EyeIcon />
        </button>
      ) : null}

      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          className={`order-action ${action.tone}`}
          onClick={() => onUpdateStatus(order, action.status)}
        >
          {action.icon ? <span className="order-action-icon"><ActionIcon icon={action.icon} /></span> : null}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function OrderManagementScreen() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  useEffect(() => {
    let unsubSnapshot = () => {};

    const unsubAuth = onAuthStateChanged(auth, (seller) => {
      unsubSnapshot();

      if (!seller) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const q = query(collectionGroup(db, "orders"), orderBy("createdAt", "desc"));

      unsubSnapshot = onSnapshot(
        q,
        async (snapshot) => {
          const customerCache = new Map();

          const sellerOrders = await Promise.all(
            snapshot.docs
              .map((snap) => ({
                id: snap.id,
                ref: snap.ref,
                customerUid: snap.ref.parent?.parent?.id ?? null,
                ...snap.data(),
              }))
              .filter((order) => order.items?.some((item) => item.sellerId === seller.uid))
              .map(async (order) => {
                const sellerItems = order.items.filter((item) => item.sellerId === seller.uid);
                const customerId = getCustomerId(order);
                let customerProfile = null;

                if (customerId) {
                  if (!customerCache.has(customerId)) {
                    customerCache.set(
                      customerId,
                      getDoc(doc(db, "users", customerId))
                        .then((snap) => (snap.exists() ? snap.data() : null))
                        .catch(() => null),
                    );
                  }
                  customerProfile = await customerCache.get(customerId);
                }

                return {
                  ...order,
                  status: normalizeStatus(order.status),
                  items: sellerItems,
                  sellerSubtotal: sellerItems.reduce(
                    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
                    0,
                  ),
                  customerName: getNonEmptyString(
                    order.customerName,
                    order.customer?.displayName,
                    order.customer?.name,
                    getCustomerName(customerProfile),
                    customerId ? `User ${customerId.slice(0, 6)}` : null,
                  ),
                  customerEmail: getNonEmptyString(
                    order.customerEmail,
                    order.customer?.email,
                    getCustomerEmail(customerProfile),
                  ),
                };
              }),
          );

          setOrders(sellerOrders);
          setSelectedOrder((current) => sellerOrders.find((order) => order.id === current?.id) ?? null);
          setLoading(false);
        },
        (err) => {
          console.error("Firestore error:", err.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubAuth();
      unsubSnapshot();
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (selectedTab === "all") return orders;
    return orders.filter((order) => order.status === selectedTab);
  }, [orders, selectedTab]);

  const counts = useMemo(() => {
    const result = { all: orders.length, pending: 0, accepted: 0, placed: 0, delivered: 0, cancelled: 0 };
    orders.forEach((order) => {
      if (result[order.status] !== undefined) result[order.status] += 1;
    });
    return result;
  }, [orders]);

  const updateStatus = async (order, newStatus) => {
    try {
      await updateDoc(order.ref, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Status update failed:", err);
      window.alert("Failed to update order status.");
    }
  };

  return (
    <SellerLayout selectedMenu="Orders" title="Orders" subtitle={formattedDate} contentClassName="no-pad">
      <main className="order-content">
        <section>
          <h2 className="order-page-title">Order Management</h2>
          <p className="order-page-subtitle">Manage and fulfill customer orders</p>
        </section>

        <div className="order-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`order-tab ${tab.key === selectedTab ? "selected" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label} ({counts[tab.key] ?? 0})
            </button>
          ))}
        </div>

        <div className="order-table-wrap">
          {loading ? (
            <p className="order-empty-state">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="order-empty-state">No orders found.</p>
          ) : (
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Earnings</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="align-right action-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const badge = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;

                  return (
                    <tr key={order.id}>
                      <td>
                        <p className="order-id">{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="order-date">{formatDate(order.createdAt)}</p>
                      </td>
                      <td>
                        <div className="order-customer-cell">
                          <p className="order-customer-name">{order.customerName ?? "-"}</p>
                          <p className="order-customer-email">{order.customerEmail ?? "-"}</p>
                        </div>
                      </td>
                      <td>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                      <td className="earnings">${order.sellerSubtotal.toFixed(2)}</td>
                      <td>
                        <span className="order-status" style={{ background: badge.background, color: badge.color }}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>{order.paymentMethod ?? "-"}</td>
                      <td className="align-right action-cell">
                        <ActionButtons order={order} onView={setSelectedOrder} onUpdateStatus={updateStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {selectedOrder ? (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
        />
      ) : null}
    </SellerLayout>
  );
}

function OrderDetailModal({ order, onClose, onUpdateStatus }) {
  const badge = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;

  return (
    <div className="order-detail-modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="order-detail-modal-head">
          <h3>Order Details</h3>
          <button type="button" onClick={onClose} aria-label="Close order details">
            x
          </button>
        </div>

        <p className="order-detail-id-label">Order ID</p>
        <p className="order-detail-id">{order.orderNumber ?? order.id}</p>

        <div className="order-detail-info-grid">
          <div>
            <h4>Order Info</h4>
            <p>Date: {formatDate(order.createdAt)}</p>
            <p>Payment: {order.paymentMethod ?? "-"}</p>
            <p>
              Status:{" "}
              <span className="order-status" style={{ background: badge.background, color: badge.color }}>
                {formatStatusLabel(order.status)}
              </span>
            </p>
          </div>
          <div>
            <h4>Customer</h4>
            <p>{order.customerName ?? "-"}</p>
            <p>{order.customerEmail ?? "-"}</p>
            <p>{order.shippingAddress ?? "-"}</p>
          </div>
        </div>

        <h4 className="order-detail-items-title">Your Items in this Order</h4>
        <div className="order-detail-items-list">
          {order.items.map((item, index) => (
            <div className="order-detail-item-card" key={`${item.productId ?? item.title}-${index}`}>
              <div className="order-detail-item-thumb">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  "IMG"
                )}
              </div>
              <div className="order-detail-item-copy">
                <p className="item-title">{item.title}</p>
                <p>Qty: {item.quantity}</p>
                <p>Unit price: ${Number(item.price ?? 0).toFixed(2)}</p>
              </div>
              <p className="order-detail-item-price">
                ${(Number(item.price ?? 0) * Number(item.quantity ?? 0)).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="order-detail-price-list">
          <div className="order-detail-price-line">
            <span>Items subtotal</span>
            <span>${order.sellerSubtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="order-detail-earnings-row">
          <p>Your Earnings</p>
          <strong>${order.sellerSubtotal.toFixed(2)}</strong>
        </div>

        <div className="order-detail-actions">
          <ActionButtons order={order} onUpdateStatus={onUpdateStatus} showView={false} />
        </div>
      </div>
    </div>
  );
}
