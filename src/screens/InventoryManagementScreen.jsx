import { useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import { db } from "../firebase";
import {
  buildStockUpdatePayload,
  DEFAULT_STOCK_THRESHOLD,
  useSellerInventoryProducts,
} from "../utils/inventory";
import "./InventoryManagementScreen.css";

function InventoryManagementScreen() {
  const navigate = useNavigate();
  const { products: inventoryItems, loading } = useSellerInventoryProducts();
  const [adjustDialog, setAdjustDialog] = useState({ open: false, item: null });
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [quantity, setQuantity] = useState("0");
  const [threshold, setThreshold] = useState(String(DEFAULT_STOCK_THRESHOLD));
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const formattedDate = useMemo(() => new Intl.DateTimeFormat("en-CA").format(new Date()), []);

  const lowStockItems = useMemo(
    () => inventoryItems.filter((item) => item.stock < item.threshold),
    [inventoryItems],
  );

  const stats = useMemo(() => {
    const outOfStock = inventoryItems.filter((item) => item.stock <= 0).length;
    return {
      totalSkus: inventoryItems.length,
      lowStock: lowStockItems.length,
      outOfStock,
    };
  }, [inventoryItems, lowStockItems]);

  const openAdjustDialog = (item) => {
    setAdjustmentType("add");
    setQuantity("0");
    setThreshold(String(item.threshold ?? DEFAULT_STOCK_THRESHOLD));
    setReason("");
    setAdjustDialog({ open: true, item });
  };

  const closeAdjustDialog = () => {
    setAdjustDialog({ open: false, item: null });
  };

  const applyAdjustment = async () => {
    if (!adjustDialog.item || isSaving) return;

    const qty = Number(quantity) || 0;
    const nextThreshold = Number(threshold) || DEFAULT_STOCK_THRESHOLD;
    if (qty < 0) return;

    let nextStock = adjustDialog.item.stock;
    if (adjustmentType === "add") nextStock = adjustDialog.item.stock + qty;
    if (adjustmentType === "remove") nextStock = Math.max(adjustDialog.item.stock - qty, 0);
    if (adjustmentType === "set") nextStock = qty;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "products", adjustDialog.item.id), {
        ...buildStockUpdatePayload(adjustDialog.item, nextStock, nextThreshold),
        inventoryAdjustmentReason: reason || null,
        updatedAt: serverTimestamp(),
      });
      closeAdjustDialog();
    } catch (error) {
      console.error("Inventory update failed:", error);
      window.alert("Failed to update product stock.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SellerLayout selectedMenu="Inventory" title="Inventory" subtitle={formattedDate} contentClassName="no-pad">
      <main className="inventory-content">
        <section>
          <h2 className="inventory-page-title">Inventory Management</h2>
          <p className="inventory-page-subtitle">Track and manage your product stock levels</p>
        </section>

        <section className="inventory-stats-grid">
          <article className="inventory-stat-card">
            <div className="inventory-stat-icon blue">Box</div>
            <p>Total SKUs</p>
            <h3>{stats.totalSkus}</h3>
          </article>
          <article className="inventory-stat-card">
            <div className="inventory-stat-icon amber">Warn</div>
            <p>Low Stock Alerts</p>
            <h3>{stats.lowStock}</h3>
          </article>
          <article className="inventory-stat-card">
            <div className="inventory-stat-icon red">Stop</div>
            <p>Out of Stock</p>
            <h3>{stats.outOfStock}</h3>
          </article>
        </section>

        {lowStockItems.length ? (
          <section className="low-stock-banner">
            <div className="low-stock-title-row">
              <span className="low-stock-icon">!</span>
              <h3>Low Stock Alerts</h3>
            </div>

            {lowStockItems.map((item) => (
              <div className="low-stock-item-row" key={item.id}>
                <div className="low-stock-thumb">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : "IMG"}
                </div>
                <div className="low-stock-text">
                  <p>{item.name}</p>
                  <span>{item.variant || "Default variant"} | SKU: {item.sku}</span>
                </div>
                <strong>{item.stock} units left</strong>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/add-stock", {
                      state: {
                        productId: item.id,
                        productName: item.name,
                        variant: item.variant,
                        sku: item.sku,
                        category: item.category,
                        brand: item.brand,
                        sellingPrice: item.sellingPrice,
                        currentStock: item.stock,
                        minThreshold: item.threshold,
                        imageUrl: item.imageUrl,
                        raw: item.raw,
                      },
                    })
                  }
                >
                  Restock
                </button>
              </div>
            ))}
          </section>
        ) : null}

        <section className="inventory-table-card">
          <h3>Inventory Overview</h3>
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Variant</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">Loading inventory...</td>
                  </tr>
                ) : inventoryItems.length ? (
                  inventoryItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="inventory-product-cell">
                          <div className="inventory-thumb">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : "IMG"}
                          </div>
                          <div>
                            <p className="inventory-product-name">{item.name}</p>
                            <p className="inventory-product-brand">{item.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td>{item.sku}</td>
                      <td>{item.variant || "Default variant"}</td>
                      <td className="stock-value">{item.stock}</td>
                      <td>{item.threshold}</td>
                      <td>
                        <span className={`inventory-status ${item.status === "In Stock" ? "ok" : "low"}`}>{item.status}</span>
                      </td>
                      <td>
                        <button type="button" className="inventory-edit-btn" onClick={() => openAdjustDialog(item)}>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No products found in inventory.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {adjustDialog.open && adjustDialog.item ? (
        <div className="adjust-overlay" onClick={closeAdjustDialog}>
          <section className="adjust-modal" onClick={(event) => event.stopPropagation()}>
            <div className="adjust-head">
              <div>
                <h3>Adjust Inventory</h3>
                <p>Make manual stock adjustments</p>
              </div>
              <button type="button" className="adjust-close" onClick={closeAdjustDialog}>
                x
              </button>
            </div>

            <div className="adjust-product-box">
              <strong>{adjustDialog.item.name}</strong>
              <p>
                SKU: {adjustDialog.item.sku} | Current Stock: {adjustDialog.item.stock}
              </p>
            </div>

            <label className="adjust-field">
              Adjustment Type
              <select value={adjustmentType} onChange={(event) => setAdjustmentType(event.target.value)}>
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
                <option value="set">Set Exact Stock</option>
              </select>
            </label>

            <label className="adjust-field">
              Quantity
              <input type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </label>

            <label className="adjust-field">
              Low Stock Threshold
              <input type="number" min="0" value={threshold} onChange={(event) => setThreshold(event.target.value)} />
            </label>

            <label className="adjust-field">
              Reason
              <select value={reason} onChange={(event) => setReason(event.target.value)}>
                <option value="">Select reason</option>
                <option value="restock">Restock</option>
                <option value="correction">Inventory correction</option>
                <option value="return">Customer return</option>
                <option value="damage">Damaged goods</option>
              </select>
            </label>

            <div className="adjust-actions">
              <button type="button" className="adjust-apply-btn" onClick={applyAdjustment} disabled={isSaving}>
                {isSaving ? "Saving..." : "Apply Adjustment"}
              </button>
              <button type="button" className="adjust-cancel-btn" onClick={closeAdjustDialog} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </SellerLayout>
  );
}

export default InventoryManagementScreen;
