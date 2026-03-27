import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { useSellerOrders } from "../utils/orders";
import "./TodaysRevenueScreen.css";

const TAX_RATE = 0.05;
const COMMISSION_RATE = 0.015;

function getStartOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return Number(value.replace(/[^0-9.-]/g, "")) || 0;
  return 0;
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

function formatHourLabel(hour) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
  }).format(new Date(2026, 0, 1, hour));
}

function TodaysRevenueScreen() {
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

  const revenueData = useMemo(() => {
    const startOfToday = getStartOfDay();
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const todaysOrders = orders
      .filter(
        (order) =>
          order.status === "delivered"
          && order.createdAtDate
          && order.createdAtDate >= startOfToday
          && order.createdAtDate < endOfToday,
      )
      .map((order) => {
        const grossRevenue = parseAmount(order.total ?? order.finalPaidAmount);
        const commission = grossRevenue * COMMISSION_RATE;
        const tax = grossRevenue * TAX_RATE;
        const earnings = grossRevenue - commission - tax;

        return {
          ...order,
          grossRevenue,
          commission,
          tax,
          earnings,
          timeLabel: formatTime(order.createdAtDate),
          customerLabel: `${order.customerName ?? order.customer?.displayName ?? order.customer?.name ?? "Customer"} - ${order.items.length} item${order.items.length !== 1 ? "s" : ""}`,
        };
      });

    const revenueByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: formatHourLabel(hour),
      revenue: 0,
    }));

    todaysOrders.forEach((order) => {
      const hour = order.createdAtDate?.getHours?.();
      if (typeof hour !== "number") return;
      revenueByHour[hour].revenue += order.grossRevenue;
    });

    const yesterdaysOrders = orders
      .filter(
        (order) =>
          order.status === "delivered"
          && order.createdAtDate
          && order.createdAtDate >= startOfYesterday
          && order.createdAtDate < startOfToday,
      )
      .map((order) => {
        const grossRevenue = parseAmount(order.total ?? order.finalPaidAmount);
        const commission = grossRevenue * COMMISSION_RATE;
        const tax = grossRevenue * TAX_RATE;
        return {
          grossRevenue,
          earnings: grossRevenue - commission - tax,
        };
      });

    const grossRevenue = todaysOrders.reduce((sum, order) => sum + order.grossRevenue, 0);
    const commission = todaysOrders.reduce((sum, order) => sum + order.commission, 0);
    const taxCollected = todaysOrders.reduce((sum, order) => sum + order.tax, 0);
    const yourEarnings = grossRevenue - commission - taxCollected;

    const yesterdayEarnings = yesterdaysOrders.reduce((sum, order) => sum + order.earnings, 0);
    const vsYesterday = yesterdayEarnings ? ((yourEarnings - yesterdayEarnings) / yesterdayEarnings) * 100 : null;

    return {
      todaysOrders,
      revenueByHour,
      grossRevenue,
      commission,
      taxCollected,
      yourEarnings,
      yesterdayEarnings,
      yesterdayOrdersCount: yesterdaysOrders.length,
      vsYesterday,
    };
  }, [orders]);

  return (
    <SellerLayout selectedMenu="Dashboard" title="Today's Revenue" subtitle={formattedDate} contentClassName="no-pad">
      <main className="today-revenue-content">
        <button type="button" className="today-revenue-back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="today-revenue-header">
          <div className="today-revenue-icon-wrap">
            <img src="/icons/payments.svg" alt="" />
          </div>
          <div>
            <h2>Today&apos;s Revenue</h2>
            <p>{formattedDate}</p>
          </div>
        </section>

        <section className="today-revenue-stats-grid">
          <article className="today-revenue-stat-card highlight">
            <p>Your Earnings</p>
            <h3 className="positive">{formatCurrency(revenueData.yourEarnings)}</h3>
            <span>
              {revenueData.vsYesterday === null
                ? "No yesterday data"
                : `${revenueData.vsYesterday >= 0 ? "+" : ""}${revenueData.vsYesterday.toFixed(1)}% vs yesterday`}
            </span>
          </article>
          <article className="today-revenue-stat-card">
            <p>Gross Revenue</p>
            <h3>{formatCurrency(revenueData.grossRevenue)}</h3>
            <span>Total earnings for today</span>
          </article>
          <article className="today-revenue-stat-card">
            <p>Commission Paid</p>
            <h3 className="negative">{formatCurrency(revenueData.commission)}</h3>
            <span>1.5% of gross revenue</span>
          </article>
          <article className="today-revenue-stat-card">
            <p>Tax Collected</p>
            <h3 className="warn">{formatCurrency(revenueData.taxCollected)}</h3>
            <span>5% tax from {revenueData.todaysOrders.length} order{revenueData.todaysOrders.length !== 1 ? "s" : ""}</span>
          </article>
        </section>

        <section className="today-revenue-chart-grid">
          <article className="today-revenue-card">
            <h3>Revenue by Hour</h3>
            <p>Today&apos;s revenue distribution throughout the day</p>
            <RevenueByHourChart data={revenueData.revenueByHour} />
          </article>
          <article className="today-revenue-card">
            <h3>Revenue Breakdown</h3>
            <p>Distribution of total revenue</p>
            <RevenueBreakdownChart
              earnings={revenueData.yourEarnings}
              commission={revenueData.commission}
              tax={revenueData.taxCollected}
            />
            <div className="today-revenue-legend">
              <Legend label="Your Earnings" tone="green" />
              <Legend label="Commission" tone="red" />
              <Legend label="Tax" tone="amber" />
            </div>
          </article>
        </section>

        <section className="today-revenue-card">
          <h3>Order-by-Order Revenue</h3>
          <p>Detailed breakdown of each order&apos;s contribution</p>
          <div className="today-revenue-orders-list">
            {loading ? (
              <article className="today-revenue-order-item">
                <div>
                  <h4>Loading today&apos;s revenue...</h4>
                  <p>Fetching today&apos;s orders</p>
                </div>
              </article>
            ) : revenueData.todaysOrders.length ? (
              revenueData.todaysOrders.map((item) => (
                <article key={item.id} className="today-revenue-order-item">
                  <div>
                    <h4>
                      Order {item.orderNumber ?? item.id}
                      <span>{item.timeLabel}</span>
                    </h4>
                    <p>{item.customerLabel}</p>
                  </div>
                  <div className="today-revenue-order-values">
                    <strong>{formatCurrency(item.earnings)}</strong>
                    <small>
                      Gross: {formatCurrency(item.grossRevenue)} - Commission: {formatCurrency(item.commission)} - Tax: {formatCurrency(item.tax)}
                    </small>
                  </div>
                </article>
              ))
            ) : (
              <article className="today-revenue-order-item">
                <div>
                  <h4>No revenue recorded today</h4>
                  <p>Today&apos;s order list will appear here</p>
                </div>
              </article>
            )}
          </div>
        </section>

        <section className="today-revenue-card">
          <h3>Comparison with Yesterday</h3>
          <div className="today-revenue-compare-grid">
            <article>
              <p>Yesterday</p>
              <h4>{formatCurrency(revenueData.yesterdayEarnings)}</h4>
              <span>{revenueData.yesterdayOrdersCount} order{revenueData.yesterdayOrdersCount !== 1 ? "s" : ""}</span>
            </article>
            <article className="today">
              <p>Today</p>
              <h4>{formatCurrency(revenueData.yourEarnings)}</h4>
              <span>{revenueData.todaysOrders.length} order{revenueData.todaysOrders.length !== 1 ? "s" : ""}</span>
            </article>
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

function RevenueByHourChart({ data }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <div className="today-revenue-hour-chart" role="img" aria-label="Revenue by hour chart">
      {data.map((item) => (
        <div key={item.hour} className="today-revenue-hour-item" title={`${item.label}: ${formatCurrency(item.revenue)}`}>
          <div className="today-revenue-hour-track">
            <div
              className="today-revenue-hour-fill"
              style={{ height: `${item.revenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 4) : 0}%` }}
            />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function RevenueBreakdownChart({ earnings, commission, tax }) {
  const total = earnings + commission + tax;
  const segments = [
    { key: "earnings", label: "Your Earnings", value: earnings, color: "#00A63E" },
    { key: "commission", label: "Commission", value: commission, color: "#E7000B" },
    { key: "tax", label: "Tax", value: tax, color: "#F54900" },
  ];
  const [selectedKey, setSelectedKey] = useState("earnings");
  const selectedSegment = segments.find((segment) => segment.key === selectedKey) ?? segments[0];
  let startAngle = -Math.PI / 2;

  return (
    <div className="today-revenue-breakdown-chart">
      <div className="today-revenue-pie-shell">
        <svg viewBox="0 0 360 300" className="today-revenue-pie-chart" role="img" aria-label="Revenue breakdown chart">
          {total > 0
            ? segments.map((segment) => {
                const angle = (segment.value / total) * Math.PI * 2;
                const endAngle = startAngle + angle;
                const isSelected = segment.key === selectedSegment?.key;
                const labelPosition = getLabelPosition(180, 138, 132, startAngle, endAngle);
                const slice = (
                  <g key={segment.key}>
                    <path
                      d={describePieSlice(180, 138, isSelected ? 97 : 90, startAngle, endAngle)}
                      fill={segment.color}
                      className="today-revenue-pie-slice"
                      style={{ cursor: segment.value > 0 ? "pointer" : "default" }}
                      onClick={() => segment.value > 0 && setSelectedKey(segment.key)}
                    />
                    <path
                      d={describePieSlice(180, 138, isSelected ? 97 : 90, startAngle, endAngle)}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      style={{ pointerEvents: "none" }}
                    />
                    <text
                      x={labelPosition.x}
                      y={labelPosition.y}
                      textAnchor={labelPosition.anchor}
                      className="today-revenue-pie-label"
                      fill={segment.color}
                    >
                      {`${segment.label.replace("Your ", "")}: ${Math.round((segment.value / total) * 100)}%`}
                    </text>
                  </g>
                );
                startAngle = endAngle;
                return slice;
              })
            : (
              <circle cx="180" cy="138" r="90" fill="#E5E7EB" />
            )}
        </svg>
      </div>
      <div className="today-revenue-breakdown-detail">
        <p>{selectedSegment?.label ?? "Revenue Segment"}</p>
        <strong>{formatCurrency(selectedSegment?.value ?? 0)}</strong>
      </div>
      <div className="today-revenue-pie-legend">
        {segments.map((segment) => (
          <button
            key={segment.key}
            type="button"
            className={`today-revenue-pie-legend-item ${segment.key === selectedSegment?.key ? "active" : ""}`}
            onClick={() => segment.value > 0 && setSelectedKey(segment.key)}
          >
            <span style={{ backgroundColor: segment.color }} />
            {segment.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function describePieSlice(cx, cy, radius, startAngle, endAngle) {
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    "Z",
  ].join(" ");
}

function getLabelPosition(cx, cy, radius, startAngle, endAngle) {
  const midAngle = (startAngle + endAngle) / 2;
  const x = cx + radius * Math.cos(midAngle);
  const y = cy + radius * Math.sin(midAngle);

  return {
    x,
    y,
    anchor: Math.cos(midAngle) >= 0 ? "start" : "end",
  };
}

function Legend({ label, tone }) {
  return (
    <div className={`legend-item ${tone}`}>
      <span />
      {label}
    </div>
  );
}

export default TodaysRevenueScreen;
