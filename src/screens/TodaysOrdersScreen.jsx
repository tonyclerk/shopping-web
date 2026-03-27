import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { useSellerOrders } from "../utils/orders";
import "./TodaysOrdersScreen.css";

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function getPrimaryItem(order) {
  return order.items?.[0] ?? {};
}

function getOrderBadge(order) {
  if (order.status === "pending") return "NEW";
  if (order.status === "accepted") return "ACCEPTED";
  if (order.status === "placed") return "PACKED";
  if (order.status === "delivered") return "DELIVERED";
  if (order.status === "cancelled") return "CANCELLED";
  return String(order.status || "ORDER").toUpperCase();
}

function TodaysOrdersScreen() {
  const navigate = useNavigate();
  const { orders, loading } = useSellerOrders();

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

  const todaysOrders = useMemo(() => {
    const startOfToday = getStartOfToday();
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    return orders
      .filter((order) => order.createdAtDate && order.createdAtDate >= startOfToday && order.createdAtDate < endOfToday)
      .map((order) => {
        const primaryItem = getPrimaryItem(order);
        return {
          ...order,
          customer: order.customerName ?? order.customer?.displayName ?? order.customer?.name ?? "Customer",
          itemsLabel: `${order.items.length} item${order.items.length !== 1 ? "s" : ""}`,
          timeLabel: formatTime(order.createdAtDate),
          productName: primaryItem.title ?? "Product",
          qty: order.quantitySold || primaryItem.quantity || 0,
          subtotal: order.finalPaidAmount,
          earnings: order.finalPaidAmount,
          productVariant: [primaryItem.size ? `Size: ${primaryItem.size}` : null, primaryItem.color ? `Color: ${primaryItem.color}` : null]
            .filter(Boolean)
            .join(", "),
          sku: primaryItem.sku ?? "SKU00001",
          customerPhone: order.customerPhone ?? order.customer?.phone ?? order.phone ?? "+1 234 567 8900",
          deliveryAddress: order.shippingAddress ?? order.deliveryAddress ?? order.customerAddress ?? "Address not available",
        };
      });
  }, [orders]);

  const summary = useMemo(() => {
    const totalOrders = todaysOrders.length;
    const totalRevenue = todaysOrders.reduce((sum, order) => sum + Number(order.finalPaidAmount ?? 0), 0);
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    return [
      { label: "Total Orders", value: String(totalOrders), color: "#155DFC" },
      { label: "Total Revenue", value: formatCurrency(totalRevenue), color: "#00A63E" },
      { label: "Average Order Value", value: formatCurrency(averageOrderValue), color: "#155DFC" },
    ];
  }, [todaysOrders]);

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
            <p>{formattedDate}</p>
          </div>
        </section>

        <section className="today-orders-summary-grid">
          {summary.map((card) => (
            <article key={card.label} className="today-orders-summary-card">
              <p>{card.label}</p>
              <h3 style={{ color: card.color }}>{card.value}</h3>
            </article>
          ))}
        </section>

        <section className="today-orders-list-card">
          <div className="today-orders-list-head">
            <div>
              <h3>All Orders ({todaysOrders.length})</h3>
              <p>Complete list of today&apos;s orders</p>
            </div>
            <button type="button" onClick={() => window.print()}>Export</button>
          </div>

          <div className="today-orders-list">
            {loading ? (
              <article className="today-order-item">
                <div className="today-order-main">
                  <h4>Loading today&apos;s orders...</h4>
                </div>
              </article>
            ) : todaysOrders.length ? (
              todaysOrders.map((order) => (
                <article key={order.id} className="today-order-item">
                  <div className="today-order-main">
                    <div className="today-order-top-row">
                      <h4>{order.orderNumber ?? order.id}</h4>
                      <span>{getOrderBadge(order)}</span>
                    </div>
                    <div className="today-order-meta-row">
                      <p>Customer: {order.customer}</p>
                      <p>Items: {order.itemsLabel}</p>
                    </div>
                    <p className="today-order-time">Time: {order.timeLabel}</p>
                    <div className="today-order-product">
                      <p>
                        {order.productName} x{order.qty}
                      </p>
                      <strong>{formatCurrency(order.subtotal)}</strong>
                    </div>
                  </div>

                  <div className="today-order-earnings">
                    <p>Your Earnings</p>
                    <h5>{formatCurrency(order.earnings)}</h5>
                    <div className="today-order-breakdown">
                      <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                      <span>Qty Sold: {order.qty}</span>
                      <span className="negative">Status: {getOrderBadge(order)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/order-details", {
                          state: {
                            orderNumber: order.orderNumber ?? order.id,
                            customerName: order.customer,
                            customerPhone: order.customerPhone,
                            deliveryAddress: order.deliveryAddress,
                            earnings: Number(order.earnings ?? 0),
                            subtotal: Number(order.subtotal ?? 0),
                            orderDate: order.createdAtDate?.toISOString?.() ?? new Date().toISOString(),
                            totalItems: Number(order.qty),
                            paymentMethod: order.paymentMethod ?? "Credit Card",
                            isNewOrder: order.status === "pending",
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
              <article className="today-order-item">
                <div className="today-order-main">
                  <h4>No orders received today</h4>
                </div>
              </article>
            )}
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

export default TodaysOrdersScreen;
