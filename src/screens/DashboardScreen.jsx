import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import useSellerSession from "../hooks/useSellerSession";
import { useSellerInventoryProducts } from "../utils/inventory";
import { useSellerOrders } from "../utils/orders";
import { isSellerApprovedAndVerified } from "../utils/sellerProfile";
import "./DashboardScreen.css";

const PERIOD_OPTIONS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const TAX_RATE = 0.05;
const COMMISSION_RATE = 0.015;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(date, compareDate) {
  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  );
}

function startOfWeek(date) {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = (day + 6) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatBucketLabel(date, period) {
  if (period === "daily") {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  }
  if (period === "weekly") {
    return `Week of ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)}`;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(date);
}

function getBuckets(period) {
  const now = new Date();

  if (period === "daily") {
    const today = startOfDay(now);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      return {
        key: date.toISOString(),
        label: formatBucketLabel(date, period),
        start: date,
        end: addDays(date, 1),
      };
    });
  }

  if (period === "weekly") {
    const thisWeek = startOfWeek(now);
    return Array.from({ length: 8 }, (_, index) => {
      const start = addDays(thisWeek, (index - 7) * 7);
      return {
        key: start.toISOString(),
        label: formatBucketLabel(start, period),
        start,
        end: addDays(start, 7),
      };
    });
  }

  const thisMonth = startOfMonth(now);
  return Array.from({ length: 6 }, (_, index) => {
    const start = addMonths(thisMonth, index - 5);
    return {
      key: start.toISOString(),
      label: formatBucketLabel(start, period),
      start,
      end: addMonths(start, 1),
    };
  });
}

function aggregateCompletedOrders(orders, period) {
  const buckets = getBuckets(period).map((bucket) => ({
    ...bucket,
    revenue: 0,
    orders: 0,
    quantity: 0,
  }));

  const completedOrders = orders.filter((order) => order.status === "delivered" && order.createdAtDate);

  completedOrders.forEach((order) => {
    const match = buckets.find((bucket) => order.createdAtDate >= bucket.start && order.createdAtDate < bucket.end);
    if (!match) return;
    match.revenue += order.finalPaidAmount;
    match.orders += 1;
    match.quantity += order.quantitySold;
  });

  return buckets;
}

function buildLinePath(points, width, height, padding) {
  if (!points.length) return "";
  const xStep = points.length === 1 ? 0 : (width - padding * 2) / (points.length - 1);
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return points
    .map((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (point.value / maxValue) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function DashboardScreen() {
  const navigate = useNavigate();
  const { seller } = useSellerSession();
  const { products } = useSellerInventoryProducts();
  const { orders } = useSellerOrders();
  const [salesPeriod, setSalesPeriod] = useState("daily");
  const [volumePeriod, setVolumePeriod] = useState("daily");

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

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock < product.threshold).length,
    [products],
  );

  const todaysOrdersCount = useMemo(() => {
    const today = new Date();
    return orders.filter((order) => order.createdAtDate && isSameDay(order.createdAtDate, today)).length;
  }, [orders]);

  const todaysEarnings = useMemo(() => {
    const today = new Date();

    return orders
      .filter((order) => order.status === "delivered" && order.createdAtDate && isSameDay(order.createdAtDate, today))
      .reduce((sum, order) => {
        const grossRevenue = Number(order.total ?? order.finalPaidAmount ?? 0);
        const commission = grossRevenue * COMMISSION_RATE;
        const tax = grossRevenue * TAX_RATE;
        return sum + (grossRevenue - commission - tax);
      }, 0);
  }, [orders]);

  const pendingFulfillmentCount = useMemo(
    () => orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length,
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "delivered"),
    [orders],
  );

  const salesData = useMemo(
    () => aggregateCompletedOrders(orders, salesPeriod),
    [orders, salesPeriod],
  );

  const volumeData = useMemo(
    () => aggregateCompletedOrders(orders, volumePeriod),
    [orders, volumePeriod],
  );

  const statCards = useMemo(
    () => [
      { label: "Today's Orders", value: String(todaysOrdersCount), icon: "orders", iconBg: "#EFF6FF" },
      { label: "Today's Revenue", value: formatCurrency(todaysEarnings), icon: "payments", iconBg: "#F0FDF4" },
      { label: "Pending Fulfillment", value: String(pendingFulfillmentCount), icon: "products", iconBg: "#FFF7ED" },
      { label: "Low Stock Alerts", value: String(lowStockCount), icon: "alert", iconBg: "#FEF2F2" },
      { label: "Returns", value: "1", icon: "returns", iconBg: "#FAF5FF" },
      { label: "Cancellations", value: "0", icon: "cancel", iconBg: "#F9FAFB" },
    ],
    [lowStockCount, pendingFulfillmentCount, todaysEarnings, todaysOrdersCount],
  );

  const insights = useMemo(
    () => [
      {
        message: `You have ${pendingFulfillmentCount} orders pending fulfillment`,
        badge: "Action Required",
        icon: "products",
        bg: "#FFF7ED",
        color: "#F54900",
      },
      {
        message: `${lowStockCount} products are running low on stock`,
        badge: lowStockCount > 0 ? "Restock Soon" : "All Good",
        icon: "alert",
        bg: "#FEF2F2",
        color: "#E7000B",
      },
      {
        message: `${completedOrders.length} completed orders available for trend analysis`,
        badge: "Live Data",
        icon: "orders",
        bg: "#EFF6FF",
        color: "#155DFC",
      },
    ],
    [completedOrders.length, lowStockCount, pendingFulfillmentCount],
  );

  const handleStatCardClick = (label) => {
    if (label === "Today's Orders") {
      navigate("/todays-orders");
      return;
    }

    if (label === "Pending Fulfillment") {
      navigate("/pending-fulfillment");
      return;
    }

    if (label === "Today's Revenue") {
      navigate("/todays-revenue");
      return;
    }

    if (label === "Low Stock Alerts") {
      navigate("/low-stock-alerts");
      return;
    }

    if (label === "Returns") {
      navigate("/returns-management");
      return;
    }

    if (label === "Cancellations") {
      navigate("/cancellations");
    }
  };

  const isApprovedAndVerified = isSellerApprovedAndVerified(seller ?? {});

  if (!isApprovedAndVerified) {
    return (
      <SellerLayout selectedMenu="Dashboard" title="Dashboard" subtitle={formattedDate} contentClassName="no-pad">
        <main className="dashboard-review-shell">
          <section className="dashboard-review-card">
            <h2>Dashboard</h2>
            <p>Your account is under review</p>
            <button type="button" className="dashboard-review-btn" onClick={() => navigate("/profile")}>
              Contact Us
            </button>
          </section>
        </main>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout selectedMenu="Dashboard" title="Dashboard" subtitle={formattedDate} contentClassName="no-pad">
      <main className="dashboard-content">
        <section>
          <h2 className="welcome-title">John Doe</h2>
          <p className="welcome-subtitle">Welcome back! Here's your business overview.</p>
        </section>

        <section className="stats-grid">
          {statCards.map((card) => (
            <button key={card.label} type="button" className="card-box stat-card" onClick={() => handleStatCardClick(card.label)}>
              <div>
                <p className="stat-label">{card.label}</p>
                <p className="stat-value">{card.value}</p>
              </div>
              <div className="stat-icon-wrap" style={{ backgroundColor: card.iconBg }}>
                <img src={`/icons/${card.icon}.svg`} alt="" />
              </div>
            </button>
          ))}
        </section>

        <section className="chart-row">
          <article className="card-box chart-card">
            <div className="chart-head">
              <div>
                <h3>Sales Trend</h3>
                <p>Completed order revenue by order date, quantity sold, and paid amount</p>
              </div>
              <PeriodSelector value={salesPeriod} onChange={setSalesPeriod} />
            </div>
            <LineChart data={salesData} />
          </article>

          <article className="card-box chart-card">
            <div className="chart-head">
              <div>
                <h3>Order Volume</h3>
                <p>Number of completed orders per period</p>
              </div>
              <PeriodSelector value={volumePeriod} onChange={setVolumePeriod} />
            </div>
            <BarChart data={volumeData} />
          </article>
        </section>

        <section className="card-box insights-card">
          <h3>Quick Insights</h3>
          <div className="insights-list">
            {insights.map((insight) => (
              <div key={insight.message} className="insight-item" style={{ backgroundColor: insight.bg }}>
                <img src={`/icons/${insight.icon}.svg`} alt="" />
                <p>{insight.message}</p>
                <span style={{ color: insight.color }}>{insight.badge}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

function PeriodSelector({ value, onChange }) {
  return (
    <div className="chart-period-tabs">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className={value === option.key ? "selected" : ""}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function LineChart({ data }) {
  const width = 520;
  const height = 240;
  const padding = 22;
  const maxValue = Math.max(...data.map((point) => point.revenue), 1);
  const xStep = data.length === 1 ? 0 : (width - padding * 2) / (data.length - 1);
  const path = buildLinePath(data.map((point) => ({ value: point.revenue })), width, height, padding);

  return (
    <div className="chart-shell" style={{ "--chart-points": data.length }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" role="img" aria-label="Sales trend chart">
        {[0, 1, 2, 3].map((index) => {
          const y = padding + ((height - padding * 2) / 3) * index;
          return <line key={index} x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid-line" />;
        })}
        <path d={path} className="chart-line" />
        {data.map((point, index) => {
          const x = padding + index * xStep;
          const y = height - padding - (point.revenue / maxValue) * (height - padding * 2);
          return <circle key={point.key} cx={x} cy={y} r="4" className="chart-dot" />;
        })}
      </svg>

      <div className="chart-x-axis">
        {data.map((point) => (
          <span key={point.key}>{point.label}</span>
        ))}
      </div>

      <div className="chart-summary-row">
        {data.map((point) => (
          <div key={point.key} className="chart-summary-card">
            <strong>${point.revenue.toFixed(0)}</strong>
            <span>{point.quantity} units</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const maxOrders = Math.max(...data.map((point) => point.orders), 1);

  return (
    <div className="chart-shell">
      <div className="bar-chart" role="img" aria-label="Order volume chart">
        {data.map((point) => (
          <div key={point.key} className="bar-chart-item">
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${(point.orders / maxOrders) * 100}%` }} />
            </div>
            <strong>{point.orders}</strong>
            <span>{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardScreen;
