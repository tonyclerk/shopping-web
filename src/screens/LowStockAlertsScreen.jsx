import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { useSellerInventoryProducts } from "../utils/inventory";
import "./LowStockAlertsScreen.css";

const TIPS = [
  "Set appropriate minimum thresholds based on your sales velocity.",
  "Monitor critical items daily to avoid stockouts.",
  "Consider enabling auto-reorder for fast-moving products.",
  "Review and adjust thresholds seasonally for better planning.",
];

const FILTERS = {
  all: "Total Alerts",
  out_of_stock: "Out of Stock",
  very_low: "Very Low (<=2)",
  low_stock: "Low Stock",
};

function LowStockAlertsScreen() {
  const navigate = useNavigate();
  const { products, loading } = useSellerInventoryProducts();
  const [activeFilter, setActiveFilter] = useState("all");

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

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock < product.threshold),
    [products],
  );

  const outOfStockProducts = useMemo(
    () => lowStockProducts.filter((product) => product.stock <= 0),
    [lowStockProducts],
  );

  const veryLowProducts = useMemo(
    () => lowStockProducts.filter((product) => product.stock > 0 && product.stock <= 2),
    [lowStockProducts],
  );

  const filteredProducts = useMemo(() => {
    if (activeFilter === "out_of_stock") return outOfStockProducts;
    if (activeFilter === "very_low") return veryLowProducts;
    if (activeFilter === "low_stock") return lowStockProducts.filter((product) => product.stock > 2);
    return lowStockProducts;
  }, [activeFilter, lowStockProducts, outOfStockProducts, veryLowProducts]);

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
            <p>Products with stock below their configured threshold requiring attention</p>
          </div>
        </section>

        <section className="low-stock-stats-grid">
          <StatCard
            label="Total Alerts"
            value={String(lowStockProducts.length)}
            color="#0A0A0A"
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          <StatCard
            label="Out of Stock"
            value={String(outOfStockProducts.length)}
            color="#E7000B"
            active={activeFilter === "out_of_stock"}
            onClick={() => setActiveFilter("out_of_stock")}
          />
          <StatCard
            label="Very Low (<=2)"
            value={String(veryLowProducts.length)}
            color="#F54900"
            active={activeFilter === "very_low"}
            onClick={() => setActiveFilter("very_low")}
          />
          <StatCard
            label="Low Stock"
            value={String(lowStockProducts.filter((product) => product.stock > 2).length)}
            color="#D08700"
            active={activeFilter === "low_stock"}
            onClick={() => setActiveFilter("low_stock")}
          />
        </section>

        <section className="low-stock-products-list">
          {loading ? (
            <article className="low-stock-product-card">
              <div className="low-stock-product-main">
                <h3>Loading products...</h3>
              </div>
            </article>
          ) : filteredProducts.length ? (
            filteredProducts.map((product) => {
              const stockTone = product.stock <= 0 ? "#E7000B" : product.stock <= 2 ? "#F54900" : "#D08700";
              const price =
                typeof product.sellingPrice === "number"
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(product.sellingPrice)
                  : product.sellingPrice;

              return (
                <article key={product.id} className="low-stock-product-card">
                  <div className="low-stock-product-thumb">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : "IMG"}
                  </div>

                  <div className="low-stock-product-main">
                    <div className="low-stock-title-row">
                      <h3>{product.name}</h3>
                      <span style={{ backgroundColor: stockTone }}>{product.stock <= 0 ? "OUT OF STOCK" : "LOW STOCK"}</span>
                    </div>

                    <div className="category-pill">{product.category || "Uncategorized"}</div>
                    <p className="brand-line">{product.brand || "No brand"}</p>
                    <p className="sku-line">SKU: {product.sku}</p>

                    <div className="stock-level-row">
                      <p>Stock Level</p>
                      <strong style={{ color: stockTone }}>{product.stock} units</strong>
                    </div>

                    <progress max={Math.max(product.threshold, 1)} value={Math.max(product.stock, 0)} />
                    <small>Threshold: {product.threshold} units</small>

                    <div className="stock-grid">
                      <div>
                        <small>Current Stock</small>
                        <strong style={{ color: stockTone }}>{product.stock} units</strong>
                      </div>
                      <div>
                        <small>Min. Threshold</small>
                        <strong>{product.threshold} units</strong>
                      </div>
                    </div>
                  </div>

                  <div className="low-stock-product-side">
                    <p>Selling Price</p>
                    <h4>{price || "-"}</h4>

                    <button
                      type="button"
                      className="dark-btn"
                      onClick={() =>
                        navigate("/add-stock", {
                          state: {
                            productId: product.id,
                            productName: product.name,
                            variant: product.variant,
                            sku: product.sku,
                            category: product.category,
                            brand: product.brand,
                            sellingPrice: price,
                            currentStock: product.stock,
                            minThreshold: product.threshold,
                            imageUrl: product.imageUrl,
                            raw: product.raw,
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
                            productId: product.id,
                            productName: product.name,
                            brand: product.brand,
                            category: product.category,
                            sku: product.sku,
                            size: "",
                            color: "",
                            description: product.raw?.description ?? "Product description...",
                            sellingPrice: price,
                            currentStock: product.stock,
                            minThreshold: product.threshold,
                            imageUrl: product.imageUrl,
                            raw: product.raw,
                          },
                        })
                      }
                    >
                      Edit Product
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="low-stock-product-card">
              <div className="low-stock-product-main">
                <h3>No products in {FILTERS[activeFilter]}</h3>
                <p>Select another filter or wait for inventory levels to change.</p>
              </div>
            </article>
          )}
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

function StatCard({ label, value, color, active = false, onClick }) {
  return (
    <button type="button" className={`low-stock-stat-card ${active ? "highlight" : ""}`} onClick={onClick}>
      <p>{label}</p>
      <h3 style={{ color }}>{value}</h3>
    </button>
  );
}

export default LowStockAlertsScreen;
