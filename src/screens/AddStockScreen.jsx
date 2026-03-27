import { useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { db } from "../firebase";
import { buildStockUpdatePayload, DEFAULT_STOCK_THRESHOLD } from "../utils/inventory";
import "./AddStockScreen.css";

const EMPTY_PRODUCT = {
  productId: "",
  productName: "",
  variant: "",
  sku: "",
  category: "",
  brand: "",
  sellingPrice: "",
  currentStock: 0,
  minThreshold: DEFAULT_STOCK_THRESHOLD,
  imageUrl: "",
};

function AddStockScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const product = { ...EMPTY_PRODUCT, ...(location.state ?? {}) };

  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState(String(product.minThreshold || DEFAULT_STOCK_THRESHOLD));
  const [supplier, setSupplier] = useState("");
  const [invoice, setInvoice] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
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

  const currentStock = Number(product.currentStock) || 0;
  const minThreshold = Number(threshold) || DEFAULT_STOCK_THRESHOLD;
  const quantityNumber = Number(quantity) || 0;
  const nextStock = currentStock + quantityNumber;
  const belowMinimum = Math.max(minThreshold - currentStock, 0);

  const stockLevel = currentStock === 0 ? "OUT OF STOCK" : currentStock <= 2 ? "VERY LOW" : currentStock < minThreshold ? "LOW" : "GOOD";
  const stockTone = currentStock === 0 ? "danger" : currentStock <= 2 ? "critical" : currentStock < minThreshold ? "warning" : "ok";

  const submit = async (event) => {
    event.preventDefault();
    if (!product.productId) {
      window.alert("Product details are missing.");
      return;
    }
    if (!quantityNumber || quantityNumber < 1) {
      window.alert("Enter stock quantity greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "products", product.productId), {
        ...buildStockUpdatePayload(
          { raw: location.state?.raw ?? {} },
          nextStock,
          minThreshold,
        ),
        supplier: supplier || null,
        invoiceNumber: invoice || null,
        costPerUnit: cost ? Number(cost) : null,
        stockNotes: notes || null,
        updatedAt: serverTimestamp(),
      });

      window.alert(`Stock updated for ${product.productName}. New stock: ${nextStock} units.`);
      navigate("/inventory");
    } catch (error) {
      console.error("Add stock failed:", error);
      window.alert("Failed to update stock.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SellerLayout selectedMenu="Inventory" title="add-stock" subtitle={formattedDate} contentClassName="no-pad">
      <main className="add-stock-content">
        <button type="button" className="add-stock-back-btn" onClick={() => navigate("/inventory")}>
          <img src="/icons/dashboard.svg" alt="" />
          Back to Low Stock
        </button>

        <section className="add-stock-title-wrap">
          <div className="add-stock-title-icon">
            <img src="/icons/inventory.svg" alt="" />
          </div>
          <div>
            <h2>Add Stock</h2>
            <p>Restock inventory for {product.productName || "selected product"}</p>
          </div>
        </section>

        <form className="add-stock-layout-grid" onSubmit={submit}>
          <div className="add-stock-main-col">
            <section className="add-stock-card">
              <div className="card-head">
                <h3>Stock Details</h3>
                <p>Enter the quantity you&apos;re adding to inventory</p>
              </div>
              <div className="field-grid">
                <label>
                  Quantity to Add *
                  <input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="numeric" placeholder="0" />
                </label>
                <label>
                  New Threshold
                  <input value={threshold} onChange={(event) => setThreshold(event.target.value)} inputMode="numeric" placeholder="5" />
                </label>
              </div>
              <div className="next-stock-banner">
                <p>Stock After Update</p>
                <strong>{nextStock} units</strong>
              </div>
            </section>

            <section className="add-stock-card">
              <div className="card-head">
                <h3>Purchase Information</h3>
                <p>Optional details for stock procurement</p>
              </div>
              <div className="field-grid">
                <label>
                  Supplier Name
                  <input value={supplier} onChange={(event) => setSupplier(event.target.value)} placeholder="Supplier" />
                </label>
                <label>
                  Invoice Number
                  <input value={invoice} onChange={(event) => setInvoice(event.target.value)} placeholder="INV-001" />
                </label>
              </div>
              <div className="field-grid single-row">
                <label>
                  Cost per Unit
                  <input value={cost} onChange={(event) => setCost(event.target.value)} inputMode="decimal" placeholder="0.00" />
                </label>
              </div>
              <label>
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Additional notes about this stock addition..."
                />
              </label>

              <div className="action-row">
                <button type="submit" className="add-stock-submit-btn" disabled={isSaving || !product.productId}>
                  {isSaving ? "Saving..." : "Add Stock to Inventory"}
                </button>
                <button type="button" className="add-stock-cancel-btn" onClick={() => navigate("/inventory")} disabled={isSaving}>
                  Cancel
                </button>
              </div>
            </section>
          </div>

          <aside className="add-stock-side-col">
            <section className="add-stock-card">
              <div className="card-head inline-icon">
                <img src="/icons/products.svg" alt="" />
                <h3>Product Details</h3>
              </div>
              <div className="product-image-placeholder">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.productName} /> : "IMG"}
              </div>
              <div className="kv-list">
                <KvRow label="Product Name" value={product.productName || "-"} />
                <KvRow label="Variant" value={product.variant || "Default variant"} />
                <KvRow label="SKU" value={product.sku || "-"} mono />
                <KvRow label="Category" value={product.category || "-"} />
                <KvRow label="Brand" value={product.brand || "-"} />
                <KvRow label="Selling Price" value={product.sellingPrice || "-"} big />
              </div>
            </section>

            <section className={`add-stock-card status-card ${stockTone}`}>
              <div className="card-head inline-icon">
                <img src="/icons/alert.svg" alt="" />
                <h3>Current Status</h3>
              </div>

              <div className="status-row">
                <span>Stock Level</span>
                <span className="status-pill">{stockLevel}</span>
              </div>

              <div className="status-count">
                <strong>{currentStock}</strong>
                <p>units available</p>
              </div>

              <ul className="status-meta">
                <li>Minimum threshold: {minThreshold} units</li>
                <li>Current below minimum by {belowMinimum} units</li>
              </ul>
            </section>
          </aside>
        </form>
      </main>
    </SellerLayout>
  );
}

function KvRow({ label, value, mono = false, big = false }) {
  return (
    <div className="kv-row">
      <p>{label}</p>
      <span className={`${mono ? "mono" : ""} ${big ? "big" : ""}`.trim()}>{value}</span>
    </div>
  );
}

export default AddStockScreen;
