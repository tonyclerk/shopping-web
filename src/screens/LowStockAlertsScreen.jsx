import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./LowStockAlertsScreen.css";

const LOW_STOCK_PRODUCTS = [
  {
    productName: "Formal Oxfords",
    badge: "LOW STOCK",
    badgeColor: "#D08700",
    category: "Shoes",
    brand: "Classic Footwear - Blue",
    sku: "SKU: SKU21002",
    stockLevel: "5 units",
    stockLevelColor: "#D08700",
    threshold: "Threshold: 10 units",
    currentStock: "5 units",
    minThreshold: "10 units",
    sellingPrice: "$2,360",
    progressValue: 0.5,
  },
  {
    productName: "Leather Belt",
    badge: "LOW STOCK",
    badgeColor: "#D08700",
    category: "Accessories",
    brand: "Urban Style - Black",
    sku: "SKU: SKU00001",
    stockLevel: "8 units",
    stockLevelColor: "#D08700",
    threshold: "Threshold: 12 units",
    currentStock: "8 units",
    minThreshold: "12 units",
    sellingPrice: "$1,290",
    progressValue: 0.67,
  },
];

const TIPS = [
  "Set appropriate minimum thresholds based on your sales velocity.",
  "Monitor critical items daily to avoid stockouts.",
  "Consider enabling auto-reorder for fast-moving products.",
  "Review and adjust thresholds seasonally for better planning.",
];

function LowStockAlertsScreen() {
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
    <SellerLayout selectedMenu="Inventory" title="Low Stock" subtitle={formattedDate} contentClassName="no-pad">
      <main className="low-stock-content">
        <button type="button" className="low-stock-back-btn" onClick={() => navigate("/dashboard")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Dashboard
        </button>

        <section className="low-stock-page-head">
          <div className="low-stock-head-icon">
            <img src="/icons/alert.svg" alt="" />
          </div>
          <div>
            <h2>Low Stock Alerts</h2>
            <p>Products below minimum stock threshold requiring attention</p>
          </div>
        </section>

        <section className="low-stock-stats-grid">
          <StatCard label="Total Alerts" value="2" color="#0A0A0A" highlight />
          <StatCard label="Out of Stock" value="0" color="#E7000B" />
          <StatCard label="Very Low (<=2)" value="0" color="#F54900" />
          <StatCard label="Low Stock" value="2" color="#D08700" />
        </section>

        <section className="low-stock-products-list">
          {LOW_STOCK_PRODUCTS.map((product) => {
            const [brandName, color] = product.brand.split(" - ");
            return (
              <article key={product.sku} className="low-stock-product-card">
                <div className="low-stock-product-thumb">IMG</div>

                <div className="low-stock-product-main">
                  <div className="low-stock-title-row">
                    <h3>{product.productName}</h3>
                    <span style={{ backgroundColor: product.badgeColor }}>{product.badge}</span>
                  </div>

                  <div className="category-pill">{product.category}</div>
                  <p className="brand-line">{product.brand}</p>
                  <p className="sku-line">{product.sku}</p>

                  <div className="stock-level-row">
                    <p>Stock Level</p>
                    <strong style={{ color: product.stockLevelColor }}>{product.stockLevel}</strong>
                  </div>

                  <progress max="1" value={product.progressValue} />
                  <small>{product.threshold}</small>

                  <div className="stock-grid">
                    <div>
                      <small>Current Stock</small>
                      <strong style={{ color: product.stockLevelColor }}>{product.currentStock}</strong>
                    </div>
                    <div>
                      <small>Min. Threshold</small>
                      <strong>{product.minThreshold}</strong>
                    </div>
                  </div>
                </div>

                <div className="low-stock-product-side">
                  <p>Selling Price</p>
                  <h4>{product.sellingPrice}</h4>

                  <button
                    type="button"
                    className="dark-btn"
                    onClick={() =>
                      navigate("/add-stock", {
                        state: {
                          productName: product.productName,
                          variant: color ?? "",
                          sku: product.sku.replace("SKU: ", ""),
                          category: product.category,
                          brand: brandName ?? product.brand,
                          sellingPrice: product.sellingPrice,
                          currentStock: Number(product.currentStock.replace(" units", "")),
                          minThreshold: Number(product.minThreshold.replace(" units", "")),
                        },
                      })
                    }
                  >
                    Add Stock
                  </button>

                  <button
                    type="button"
                    className="light-btn"
                    onClick={() =>
                      navigate("/edit-product", {
                        state: {
                          productName: product.productName,
                          brand: brandName ?? product.brand,
                          category: product.category,
                          sku: product.sku.replace("SKU: ", ""),
                          size: "",
                          color: color ?? "",
                          description: "Product description...",
                          sellingPrice: product.sellingPrice,
                          currentStock: Number(product.currentStock.replace(" units", "")),
                          openDialog: true,
                        },
                      })
                    }
                  >
                    Edit Product
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="stock-tips-card">
          <h3>Stock Management Tips</h3>
          <div>
            {TIPS.map((tip) => (
              <p key={tip}>- {tip}</p>
            ))}
          </div>
        </section>
      </main>
    </SellerLayout>
  );
}

function StatCard({ label, value, color, highlight = false }) {
  return (
    <article className={`low-stock-stat-card ${highlight ? "highlight" : ""}`}>
      <p>{label}</p>
      <h3 style={{ color }}>{value}</h3>
    </article>
  );
}

export default LowStockAlertsScreen;
