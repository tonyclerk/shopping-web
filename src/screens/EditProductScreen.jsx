import { useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { db } from "../firebase";
import { buildStockUpdatePayload, DEFAULT_STOCK_THRESHOLD, parseStockCount } from "../utils/inventory";
import "./EditProductScreen.css";

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseMoney(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

function getInitialProduct(locationState) {
  const raw = locationState?.raw ?? {};
  const primaryVariant = Array.isArray(raw.variants) && raw.variants.length ? raw.variants[0] : {};
  const regularPrice = Number(raw.originalPrice ?? primaryVariant.mrp ?? primaryVariant.basePrice ?? 0);
  const discountPercent = Number(
    String(raw.discount ?? primaryVariant.discount ?? "0").replace("%", ""),
  ) || 0;
  const currentStock = Number(locationState?.currentStock ?? raw.stockCount ?? 0);
  const threshold = Number(locationState?.minThreshold ?? raw.minThreshold ?? DEFAULT_STOCK_THRESHOLD);

  return {
    productId: locationState?.productId ?? "",
    productName: locationState?.productName ?? raw.title ?? raw.name ?? "",
    brand: locationState?.brand ?? raw.brand ?? "",
    category: locationState?.category ?? raw.category ?? "Accessories",
    sku: locationState?.sku ?? primaryVariant.sku ?? "",
    size: locationState?.size ?? primaryVariant.size ?? "",
    color: locationState?.color ?? primaryVariant.color ?? "",
    description: locationState?.description ?? raw.description ?? "",
    regularPrice,
    discountPercent,
    currentStock,
    threshold,
    imageUrl: locationState?.imageUrl ?? raw.image ?? "",
    raw,
  };
}

function EditProductScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(() => getInitialProduct(location.state));
  const [tab, setTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);

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

  const finalPrice = useMemo(() => {
    const discounted = product.regularPrice - (product.regularPrice * product.discountPercent) / 100;
    return Math.max(discounted, 0);
  }, [product.discountPercent, product.regularPrice]);

  const customerSavings = useMemo(
    () => Math.max(product.regularPrice - finalPrice, 0),
    [finalPrice, product.regularPrice],
  );

  const stockStatus =
    product.currentStock === 0
      ? "OUT OF STOCK"
      : product.currentStock <= 2
        ? "VERY LOW"
        : product.currentStock < product.threshold
          ? "LOW STOCK"
          : "IN STOCK";

  const stockNotice =
    product.currentStock < product.threshold
      ? "Stock is below threshold. Consider restocking soon."
      : "Stock is healthy and above the configured alert threshold.";

  const saveChanges = async () => {
    if (!product.productName.trim()) {
      window.alert("Product name is required.");
      return;
    }

    if (!product.productId) {
      window.alert("Product details are missing.");
      return;
    }

    const currentVariants = Array.isArray(product.raw?.variants) ? product.raw.variants : [];
    const nextVariants = currentVariants.length
      ? currentVariants.map((variant, index) =>
          index === 0
            ? {
                ...variant,
                sku: product.sku,
                size: product.size,
                color: product.color,
                mrp: product.regularPrice,
                basePrice: product.regularPrice,
                discount: product.discountPercent,
                finalPrice,
                stock: parseStockCount(variant.stock),
              }
            : variant,
        )
      : currentVariants;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "products", product.productId), {
        title: product.productName.trim(),
        name: product.productName.trim(),
        brand: product.brand.trim(),
        category: product.category,
        description: product.description.trim(),
        image: product.imageUrl || product.raw?.image || "",
        price: finalPrice,
        originalPrice: product.regularPrice,
        discount: `${product.discountPercent}%`,
        variants: nextVariants,
        ...buildStockUpdatePayload({ raw: { ...product.raw, variants: nextVariants } }, product.currentStock, product.threshold),
        updatedAt: serverTimestamp(),
      });

      window.alert(`Saved changes for ${product.productName}`);
      navigate("/low-stock-alerts");
    } catch (error) {
      console.error("Edit product failed:", error);
      window.alert("Failed to save product changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SellerLayout selectedMenu="Products" title="edit-product" subtitle={formattedDate} contentClassName="no-pad">
      <main className="edit-product-content">
        <button type="button" className="edit-back-btn" onClick={() => navigate("/low-stock-alerts")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Low Stock
        </button>

        <section className="edit-page-head">
          <div className="edit-head-icon">
            <img src="/icons/products.svg" alt="" />
          </div>
          <div>
            <h2>Edit Product</h2>
            <p>Update product details and inventory settings</p>
          </div>
        </section>

        <section className="edit-screen-grid">
          <div className="edit-main-col">
            <section className="edit-tabs">
              <button type="button" className={tab === "basic" ? "selected" : ""} onClick={() => setTab("basic")}>
                Basic Info
              </button>
              <button type="button" className={tab === "pricing" ? "selected" : ""} onClick={() => setTab("pricing")}>
                Pricing
              </button>
              <button type="button" className={tab === "inventory" ? "selected" : ""} onClick={() => setTab("inventory")}>
                Inventory
              </button>
            </section>

            {tab === "basic" ? (
              <>
                <section className="edit-card">
                  <div className="edit-card-head">
                    <h3>Product Information</h3>
                    <p>Basic product details</p>
                  </div>

                  <div className="edit-grid">
                    <label>
                      Product Name *
                      <input value={product.productName} onChange={(event) => setProduct((prev) => ({ ...prev, productName: event.target.value }))} />
                    </label>
                    <label>
                      Brand *
                      <input value={product.brand} onChange={(event) => setProduct((prev) => ({ ...prev, brand: event.target.value }))} />
                    </label>
                  </div>

                  <div className="edit-grid">
                    <label>
                      Category *
                      <input value={product.category} onChange={(event) => setProduct((prev) => ({ ...prev, category: event.target.value }))} />
                    </label>
                    <label>
                      Image URL
                      <input value={product.imageUrl} onChange={(event) => setProduct((prev) => ({ ...prev, imageUrl: event.target.value }))} />
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea value={product.description} onChange={(event) => setProduct((prev) => ({ ...prev, description: event.target.value }))} rows={4} placeholder="Product description..." />
                  </label>
                </section>

                <section className="edit-card">
                  <div className="edit-card-head">
                    <h3>Variant Details</h3>
                    <p>Size, color, and SKU information</p>
                  </div>

                  <label>
                    SKU *
                    <input value={product.sku} onChange={(event) => setProduct((prev) => ({ ...prev, sku: event.target.value }))} />
                  </label>

                  <div className="edit-grid">
                    <label>
                      Size
                      <input value={product.size} onChange={(event) => setProduct((prev) => ({ ...prev, size: event.target.value }))} placeholder="e.g., M, Large, 32GB" />
                    </label>
                    <label>
                      Color
                      <input value={product.color} onChange={(event) => setProduct((prev) => ({ ...prev, color: event.target.value }))} />
                    </label>
                  </div>
                </section>
              </>
            ) : null}

            {tab === "pricing" ? (
              <section className="edit-card">
                <div className="edit-card-head with-icon">
                  <img src="/icons/payments.svg" alt="" />
                  <div>
                    <h3>Pricing & Discounts</h3>
                    <p>Set your product price and discount</p>
                  </div>
                </div>

                <div className="edit-grid">
                  <label>
                    Regular Price *
                    <input
                      value={product.regularPrice}
                      inputMode="decimal"
                      onChange={(event) =>
                        setProduct((prev) => ({
                          ...prev,
                          regularPrice: parseMoney(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Discount %
                    <input
                      value={product.discountPercent}
                      inputMode="decimal"
                      onChange={(event) =>
                        setProduct((prev) => ({
                          ...prev,
                          discountPercent: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="price-preview-card">
                  <div className="price-preview-head">
                    <h4>Price Preview</h4>
                  </div>

                  <div className="price-preview-grid">
                    <div>
                      <span>Regular Price</span>
                      <strong>{formatCurrency(product.regularPrice)}</strong>
                    </div>
                    <div className="discount-pill-wrap">
                      <span className="discount-pill">{product.discountPercent}%</span>
                    </div>
                    <div className="final-price-box">
                      <span>Final Price</span>
                      <strong>{formatCurrency(finalPrice)}</strong>
                    </div>
                  </div>

                  <div className="savings-row">
                    <span>Customer saves</span>
                    <strong>{formatCurrency(customerSavings)}</strong>
                  </div>
                </div>
              </section>
            ) : null}

            {tab === "inventory" ? (
              <section className="edit-card">
                <div className="edit-card-head with-icon">
                  <img src="/icons/inventory.svg" alt="" />
                  <div>
                    <h3>Stock Management</h3>
                    <p>Manage inventory levels and alerts</p>
                  </div>
                </div>

                <div className="edit-grid">
                  <label>
                    Current Stock *
                    <input
                      value={product.currentStock}
                      inputMode="numeric"
                      onChange={(event) =>
                        setProduct((prev) => ({
                          ...prev,
                          currentStock: Number(event.target.value || 0),
                        }))
                      }
                    />
                    <small>Units currently available</small>
                  </label>
                  <label>
                    Low Stock Threshold *
                    <input
                      value={product.threshold}
                      inputMode="numeric"
                      onChange={(event) =>
                        setProduct((prev) => ({
                          ...prev,
                          threshold: Number(event.target.value || DEFAULT_STOCK_THRESHOLD),
                        }))
                      }
                    />
                    <small>Alert when stock falls below</small>
                  </label>
                </div>

                <div className="inventory-status-panel">
                  <p className="inventory-status-title">Stock Status</p>
                  <div className="inventory-status-row">
                    <div>
                      <span>Current Level</span>
                      <strong>{product.currentStock} units</strong>
                    </div>
                    <span className={`inventory-status-pill ${product.currentStock < product.threshold ? "low" : "ok"}`}>
                      {stockStatus}
                    </span>
                  </div>
                  <p className={`inventory-status-note ${product.currentStock < product.threshold ? "low" : "ok"}`}>
                    {product.currentStock < product.threshold ? "Alert:" : "Status:"} {stockNotice}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="edit-actions">
              <button type="button" className="save-btn" onClick={saveChanges} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" className="cancel-btn" onClick={() => navigate("/low-stock-alerts")} disabled={isSaving}>
                Cancel
              </button>
            </section>
          </div>

          <aside className="edit-side-col">
            <section className="edit-card">
              <div className="preview-head">
                <img src="/icons/products.svg" alt="" />
                <h3>Product Preview</h3>
              </div>

              <div className="preview-thumb">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.productName} /> : "IMG"}
              </div>

              <div className="preview-row">
                <p>Current Variant</p>
                <strong>{product.color || "Blue"}</strong>
              </div>
              <div className="preview-row">
                <p>Original Stock</p>
                <strong>{product.currentStock} units</strong>
              </div>
              <div className="preview-row">
                <p>Original Price</p>
                <strong>{formatCurrency(product.regularPrice)}</strong>
              </div>
            </section>

            <section className="tips-card">
              <h3>Editing Tips</h3>
              <p>- Use clear, descriptive product names</p>
              <p>- Set realistic stock thresholds based on sales velocity</p>
              <p>- Keep SKUs unique for easy tracking</p>
            </section>
          </aside>
        </section>
      </main>
    </SellerLayout>
  );
}

export default EditProductScreen;
