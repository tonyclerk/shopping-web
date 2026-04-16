import { useEffect, useMemo, useState } from "react";
import {
  collection,
  collectionGroup,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import SellerLayout from "../components/SellerLayout.jsx";
import "./ReturnsManagementScreen.css";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Completed" },
];

const normalizeStatus = (status) => {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "processing") return "pending";
  if (value === "accepted") return "accepted";
  if (value === "rejected") return "rejected";
  if (value === "completed") return "completed";
  return "pending";
};

const formatDate = (value) => {
  if (!value) return "Requested recently";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Requested recently";

  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Requested Today";
  }

  return `Requested on ${new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value) => {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};

const getItemLineTotal = (item) => {
  const qty = Number(item?.quantity ?? 1);
  const unit = Number(item?.price ?? item?.unitPrice ?? item?.amount ?? 0);
  if (!Number.isFinite(qty) || !Number.isFinite(unit)) return 0;
  return qty * unit;
};

const getReturnTotal = (data) => {
  const items = Array.isArray(data?.items) ? data.items : [];
  const computedItemsTotal = items.reduce((sum, item) => sum + getItemLineTotal(item), 0);
  if (computedItemsTotal > 0) return computedItemsTotal;

  const fallbackAmount = Number(data?.amount ?? data?.returnAmount ?? data?.refundAmount ?? 0);
  return Number.isFinite(fallbackAmount) ? fallbackAmount : 0;
};

const mapItemsToText = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "Items not available";
  return items
    .map((item) => {
      const title = item?.title ?? item?.name ?? item?.productName ?? "Item";
      const quantity = Number(item?.quantity ?? 1);
      return `${quantity}x ${title}`;
    })
    .join(", ");
};

const toReturnCard = (docSnap) => {
  const data = docSnap.data();
  const normalizedStatus = normalizeStatus(data?.status);
  return {
    id: docSnap.id,
    ref: docSnap.ref,
    status: normalizedStatus,
    disputeId: data?.disputeId ?? data?.returnId ?? docSnap.id,
    issueTag: data?.issueCategory ?? "Product Issue",
    requestedLabel: formatDate(data?.createdAt ?? data?.requestedAt ?? data?.updatedAt),
    originalOrder: data?.orderNumber
      ? `#${data.orderNumber}`
      : data?.orderId
        ? `#${data.orderId}`
        : "Order not available",
    originalOrderMeta: data?.orderDate ? `Placed on ${data.orderDate}` : "",
    reason:
      data?.reason ??
      data?.issueDescription ??
      data?.description ??
      "Customer has requested a return for this order.",
    itemsText: mapItemsToText(data?.items),
    returnAmount: getReturnTotal(data),
    returnValue: formatCurrency(getReturnTotal(data)),
    raw: data,
  };
};

function ReturnsManagementScreen() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

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
    let unsub = () => {};

    const subscribeToReturns = (preferServerFilter = true) => {
      const disputesRef = collection(db, "disputes");
      const disputesQuery = preferServerFilter ? query(disputesRef, where("type", "==", "product issue")) : query(disputesRef);

      unsub = onSnapshot(
        disputesQuery,
        (snapshot) => {
          const rows = snapshot.docs
            .filter((docSnap) => {
              if (preferServerFilter) return true;
              const data = docSnap.data();
              return String(data?.type ?? "").trim().toLowerCase() === "product issue";
            })
            .map((docSnap) => toReturnCard(docSnap));

          setReturns(rows);
          setLoading(false);
        },
        (error) => {
          if (preferServerFilter && (error?.code === "failed-precondition" || error?.code === "permission-denied")) {
            subscribeToReturns(false);
            return;
          }
          console.error("Failed to load disputes:", error);
          setReturns([]);
          setLoading(false);
        },
      );
    };

    subscribeToReturns(true);

    return () => unsub();
  }, []);

  const counts = useMemo(
    () => ({
      pending: returns.filter((item) => item.status === "pending").length,
      accepted: returns.filter((item) => item.status === "accepted").length,
      rejected: returns.filter((item) => item.status === "rejected").length,
      completed: returns.filter((item) => item.status === "completed").length,
    }),
    [returns],
  );

  const visibleReturns = useMemo(() => returns.filter((item) => item.status === selectedTab), [returns, selectedTab]);

  const handleUpdateStatus = async (item, nextStatus) => {
    if (!item?.ref) return;
    setUpdatingId(item.id);
    try {
      await updateDoc(item.ref, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to update return status:", error);
      window.alert("Failed to update return status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const tryFetchOrder = async (item) => {
    const dispute = item?.raw ?? {};

    // 1) Explicit document reference in the dispute itself.
    if (dispute?.orderRef && typeof dispute.orderRef === "object" && "id" in dispute.orderRef) {
      try {
        const snap = await getDoc(dispute.orderRef);
        if (snap.exists()) return { id: snap.id, ...snap.data() };
      } catch (error) {
        console.warn("Failed to fetch order from orderRef:", error);
      }
    }

    const orderId = dispute?.orderId ?? dispute?.order?.id ?? null;
    const orderNumber = dispute?.orderNumber ?? dispute?.order?.orderNumber ?? null;

    // 2) Try collectionGroup by order number.
    if (orderNumber) {
      try {
        const byNumber = await getDocs(
          query(collectionGroup(db, "orders"), where("orderNumber", "==", orderNumber), limit(1)),
        );
        if (!byNumber.empty) return { id: byNumber.docs[0].id, ...byNumber.docs[0].data() };
      } catch (error) {
        console.warn("Failed to fetch order by orderNumber:", error);
      }
    }

    // 3) Try collectionGroup by document id.
    if (orderId) {
      try {
        const byId = await getDocs(
          query(collectionGroup(db, "orders"), where(documentId(), "==", String(orderId)), limit(1)),
        );
        if (!byId.empty) return { id: byId.docs[0].id, ...byId.docs[0].data() };
      } catch (error) {
        console.warn("Failed to fetch order by id:", error);
      }
    }

    return null;
  };

  const handleViewOrder = async (item) => {
    setViewingItem(item);
    setViewLoading(true);
    try {
      const order = await tryFetchOrder(item);
      setViewOrder(order);
    } finally {
      setViewLoading(false);
    }
  };

  const closeOrderModal = () => {
    setViewingItem(null);
    setViewOrder(null);
    setViewLoading(false);
  };

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
          <StatCard label="Total Returns" value={String(returns.length)} />
          <StatCard label="Pending" value={String(counts.pending)} highlight />
          <StatCard label="Accepted" value={String(counts.accepted)} />
          <StatCard label="Rejected" value={String(counts.rejected)} />
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
              <span>{counts[tab.key] ?? 0}</span>
            </button>
          ))}
        </section>

        {loading ? (
          <section className="return-card">
            <p className="empty-text">Loading returns...</p>
          </section>
        ) : visibleReturns.length === 0 ? (
          <section className="return-card">
            <p className="empty-text">No returns in this category</p>
          </section>
        ) : (
          visibleReturns.map((item) => (
            <section className="return-card" key={item.id}>
              <div className="return-card-head">
                <h3>Return #{item.disputeId}</h3>
                <span className="requested-pill">REQUESTED</span>
              </div>
              <div className="return-chip-row">
                <span className="chip">{item.issueTag}</span>
                <small>{item.requestedLabel}</small>
              </div>

              <InfoBox
                label="Original Order"
                content={`${item.originalOrder}${item.originalOrderMeta ? ` - ${item.originalOrderMeta}` : ""}`}
                tone="blue"
              />
              <InfoBox label="Return Reason" content={item.reason} tone="red" />
              <InfoBox label="Items to Return" content={item.itemsText} tone="blue" />

              <p className="return-value-label">Return Value</p>
              <p className="return-value">{item.returnValue}</p>

              <div className="return-actions">
                {item.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      className="accept-btn"
                      onClick={() => handleUpdateStatus(item, "accepted")}
                      disabled={updatingId === item.id}
                    >
                      Accept Return
                    </button>
                    <button
                      type="button"
                      className="reject-btn"
                      onClick={() => handleUpdateStatus(item, "rejected")}
                      disabled={updatingId === item.id}
                    >
                      Reject Return
                    </button>
                  </>
                ) : null}

                {item.status === "accepted" ? (
                  <button
                    type="button"
                    className="completed-btn"
                    onClick={() => handleUpdateStatus(item, "completed")}
                    disabled={updatingId === item.id}
                  >
                    Mark Completed
                  </button>
                ) : null}

                <button type="button" className="view-btn" onClick={() => handleViewOrder(item)}>
                  View Order
                </button>
              </div>
            </section>
          ))
        )}

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

      {viewingItem ? (
        <OrderDialog
          item={viewingItem}
          order={viewOrder}
          loading={viewLoading}
          onClose={closeOrderModal}
        />
      ) : null}
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

function OrderDialog({ item, order, loading, onClose }) {
  const dispute = item?.raw ?? {};
  const products = Array.isArray(order?.items) && order.items.length > 0
    ? order.items
    : Array.isArray(dispute?.items)
      ? dispute.items
      : [];
  const orderDate = order?.createdAt ?? dispute?.orderCreatedAt ?? dispute?.createdAt ?? null;
  const receivedDate =
    order?.deliveredAt ??
    order?.receivedAt ??
    dispute?.receivedAt ??
    dispute?.deliveredAt ??
    (normalizeStatus(item?.status) === "completed" ? dispute?.updatedAt : null);

  const orderIdLabel =
    order?.orderNumber ??
    dispute?.orderNumber ??
    order?.id ??
    dispute?.orderId ??
    item?.originalOrder ??
    "-";
  const customerLabel =
    order?.customerName ??
    order?.customer?.displayName ??
    order?.customer?.name ??
    dispute?.customerName ??
    "-";
  const customerIdLabel =
    order?.userId ??
    order?.customerId ??
    order?.uid ??
    order?.customer?.uid ??
    dispute?.userId ??
    dispute?.customerId ??
    dispute?.uid ??
    "-";

  return (
    <div className="returns-order-modal-overlay" onClick={onClose}>
      <div className="returns-order-modal" onClick={(event) => event.stopPropagation()}>
        <div className="returns-order-modal-head">
          <h3>Order Details</h3>
          <button type="button" onClick={onClose} aria-label="Close order details">
            x
          </button>
        </div>

        {loading ? (
          <p className="empty-text">Loading order details...</p>
        ) : (
          <>
            <div className="returns-order-modal-grid">
              <div className="returns-order-modal-card">
                <small>Order ID</small>
                <p>{orderIdLabel}</p>
              </div>
            <div className="returns-order-modal-card">
              <small>Customer</small>
              <p>{customerLabel}</p>
              <small>User ID</small>
              <p>{customerIdLabel}</p>
            </div>
              <div className="returns-order-modal-card">
                <small>Order Placed</small>
                <p>{formatDateTime(orderDate)}</p>
              </div>
              <div className="returns-order-modal-card">
                <small>Order Received</small>
                <p>{formatDateTime(receivedDate)}</p>
              </div>
              <div className="returns-order-modal-card">
                <small>Return Status</small>
                <p>{String(item?.status ?? "-").toUpperCase()}</p>
              </div>
              <div className="returns-order-modal-card">
                <small>Return Value</small>
                <p>{formatCurrency(item?.returnAmount ?? 0)}</p>
              </div>
            </div>

            <div className="returns-order-products">
              <h4>Products</h4>
              {products.length === 0 ? (
                <p className="empty-text">No product details available.</p>
              ) : (
                <div className="returns-order-products-list">
                  {products.map((product, index) => {
                    const title = product?.title ?? product?.name ?? product?.productName ?? "Product";
                    const image = product?.image ?? product?.imageUrl ?? product?.thumbnail ?? "";
                    return (
                      <article className="returns-order-product-row" key={`${title}-${index}`}>
                        <div className="returns-order-product-thumb">
                          {image ? <img src={image} alt={title} /> : <span>IMG</span>}
                        </div>
                        <p>{title}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReturnsManagementScreen;
