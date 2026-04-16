import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { useSellerOrders } from "../utils/orders";
import "./CancellationsScreen.css";

const TIPS = [
  "Ensure accurate product descriptions and images",
  "Provide realistic delivery timeframes and updates",
  "Keep inventory updated to avoid cancellations due to stockouts",
  "Respond quickly to customer queries before they cancel",
  "Offer competitive pricing and consider price-match options",
];

const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
};

const getCancelledDate = (order) => {
  const raw = order?.cancelledAt ?? order?.cancellationDate ?? order?.updatedAt ?? order?.createdAtDate ?? null;
  if (!raw) return null;
  if (typeof raw?.toDate === "function") return raw.toDate();
  if (raw instanceof Date) return raw;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getCancellationReason = (order) =>
  order?.cancellationReason ?? order?.cancelReason ?? order?.reason ?? "Not specified";

function CancellationsScreen() {
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

  const cancelledOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === "cancelled")
        .map((order) => {
          const cancelledDate = getCancelledDate(order);
          return {
            ...order,
            cancelledDate,
            lostAmount: Number(order.finalPaidAmount ?? 0),
            reason: getCancellationReason(order),
          };
        })
        .sort((a, b) => (b.cancelledDate?.getTime?.() ?? 0) - (a.cancelledDate?.getTime?.() ?? 0)),
    [orders],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const weekStart = new Date(todayStart);
    const day = weekStart.getDay(); // 0 Sunday
    const offset = (day + 6) % 7; // week starts Monday
    weekStart.setDate(weekStart.getDate() - offset);

    const todayOrders = cancelledOrders.filter(
      (order) => order.cancelledDate && order.cancelledDate >= todayStart && order.cancelledDate < tomorrowStart,
    );
    const weekOrders = cancelledOrders.filter((order) => order.cancelledDate && order.cancelledDate >= weekStart);

    const todayLost = todayOrders.reduce((sum, order) => sum + order.lostAmount, 0);
    const weekLost = weekOrders.reduce((sum, order) => sum + order.lostAmount, 0);
    const totalLost = cancelledOrders.reduce((sum, order) => sum + order.lostAmount, 0);

    return {
      totalCancelled: cancelledOrders.length,
      todayCount: todayOrders.length,
      weekCount: weekOrders.length,
      todayLost,
      weekLost,
      totalLost,
    };
  }, [cancelledOrders]);

  const trendData = useMemo(() => {
    const now = new Date();
    const bars = [];
    for (let i = 6; i >= 0; i -= 1) {
      const dayStart = getStartOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = cancelledOrders.filter(
        (order) => order.cancelledDate && order.cancelledDate >= dayStart && order.cancelledDate < dayEnd,
      ).length;

      bars.push({
        key: dayStart.toISOString(),
        label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dayStart),
        count,
      });
    }

    const maxCount = Math.max(...bars.map((item) => item.count), 1);
    return bars.map((item) => ({
      ...item,
      heightPct: item.count === 0 ? 8 : Math.max(16, Math.round((item.count / maxCount) * 100)),
    }));
  }, [cancelledOrders]);

  const reasonData = useMemo(() => {
    const map = new Map();
    cancelledOrders.forEach((order) => {
      const reason = String(order.reason || "Not specified").trim() || "Not specified";
      map.set(reason, (map.get(reason) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [cancelledOrders]);

  const statItems = useMemo(
    () => [
      { label: "Total Cancelled", value: String(stats.totalCancelled), subtitle: "All time", color: "#4A5565", icon: "cancel" },
      { label: "Today", value: String(stats.todayCount), subtitle: `${formatCurrency(stats.todayLost)} lost`, color: "#E7000B", icon: "alert" },
      { label: "This Week", value: String(stats.weekCount), subtitle: `${formatCurrency(stats.weekLost)} lost`, color: "#F54900", icon: "orders" },
      { label: "Lost Revenue", value: formatCurrency(stats.totalLost), subtitle: "Total potential earnings", color: "#E7000B", icon: "payments" },
    ],
    [stats],
  );

  return (
    <SellerLayout selectedMenu="Orders" title="Cancellations" subtitle={formattedDate} contentClassName="no-pad">
      <main className="cancel-content">
        <button type="button" className="cancel-back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="cancel-title-wrap">
          <div className="cancel-title-icon">
            <img src="/icons/cancel.svg" alt="" />
          </div>
          <div>
            <h2>Cancellations</h2>
            <p>Track cancelled orders and analyze trends</p>
          </div>
        </section>

        <section className="cancel-stats-grid">
          {statItems.map((item) => (
            <article key={item.label} className="cancel-stat-card">
              <div className="cancel-stat-head">
                <span>{item.label}</span>
                <img src={`/icons/${item.icon}.svg`} alt="" />
              </div>
              <h3 style={{ color: item.color }}>{item.value}</h3>
              <p>{item.subtitle}</p>
            </article>
          ))}
        </section>

        <section className="cancel-charts-row">
          <article className="cancel-card">
            <h3>Cancellation Trend (7 Days)</h3>
            <p className="cancel-card-sub">Daily cancellation count</p>
            {loading ? (
              <div className="cancel-chart-placeholder">Loading trend...</div>
            ) : (
              <div className="cancel-trend-wrap">
                {trendData.map((bar) => (
                  <div key={bar.key} className="cancel-trend-col">
                    <div className="cancel-trend-bar-wrap">
                      <div className="cancel-trend-bar" style={{ height: `${bar.heightPct}%` }} />
                    </div>
                    <small>{bar.label}</small>
                    <span>{bar.count}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="cancel-card">
            <h3>Cancellation Reasons</h3>
            <p className="cancel-card-sub">Top reasons for order cancellation</p>
            {loading ? (
              <div className="cancel-chart-placeholder">Loading reasons...</div>
            ) : reasonData.length === 0 ? (
              <div className="cancel-chart-placeholder">No cancellation data</div>
            ) : (
              <div className="cancel-reasons-list">
                {reasonData.map((item) => (
                  <div key={item.reason} className="cancel-reason-row">
                    <p>{item.reason}</p>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="cancel-card recent-cancel-card">
          <h3>Recent Cancellations</h3>
          <p className="cancel-card-sub">Latest cancelled orders</p>
          {loading ? (
            <div className="empty-cancel-wrap">
              <h4>Loading cancellations...</h4>
            </div>
          ) : cancelledOrders.length === 0 ? (
            <div className="empty-cancel-wrap">
              <img src="/icons/cancel.svg" alt="" />
              <h4>No Cancellations</h4>
              <p>Great! You haven&apos;t had any cancelled orders</p>
            </div>
          ) : (
            <div className="recent-cancel-list">
              {cancelledOrders.slice(0, 8).map((order) => (
                <article key={order.id} className="recent-cancel-row">
                  <div>
                    <h4>{order.orderNumber ?? order.id}</h4>
                    <p>{formatDateTime(order.cancelledDate)}</p>
                  </div>
                  <div className="recent-cancel-meta">
                    <p>{order.reason}</p>
                    <strong>{formatCurrency(order.lostAmount)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="cancel-tips-card">
          <h3>Reduce Cancellations</h3>
          <div className="tips-list">
            {TIPS.map((tip) => (
              <p key={tip}>• {tip}</p>
            ))}
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

export default CancellationsScreen;
