import { useMemo, useState } from "react";
import SellerLayout from "../components/SellerLayout.jsx";
import "./InventoryManagementScreen.css";

const INVENTORY_ITEMS = [
  { name: "Leather Belt", brand: "Urban Style", sku: "SKU00001", variant: "Color: Black", stock: 24, threshold: 10, status: "In Stock" },
  { name: "Canvas Backpack", brand: "Travel Gear", sku: "SKU00002", variant: "Color: Blue, Size: M", stock: 15, threshold: 8, status: "In Stock" },
  { name: "Aviator Sunglasses", brand: "Sun Shield", sku: "SKU00003", variant: "Color: Gold", stock: 32, threshold: 12, status: "In Stock" },
  { name: "Premium Wallet", brand: "Luxury Goods", sku: "SKU00004", variant: "Color: Brown", stock: 18, threshold: 10, status: "In Stock" },
  { name: "Sports Watch", brand: "Time Master", sku: "SKU00005", variant: "Color: Black, Size: L", stock: 28, threshold: 15, status: "In Stock" },
  { name: "Running Sneakers", brand: "Sport Plus", sku: "SKU00006", variant: "Color: White, Size: 10", stock: 42, threshold: 20, status: "In Stock" },
  { name: "Denim Jacket", brand: "Fashion Hub", sku: "SKU00007", variant: "Color: Blue, Size: L", stock: 12, threshold: 8, status: "In Stock" },
  { name: "Baseball Cap", brand: "Sports Wear", sku: "SKU00008", variant: "Color: Red", stock: 35, threshold: 15, status: "In Stock" },
  { name: "Formal Oxfords", brand: "Classic Footwear", sku: "SKU21002", variant: "Color: Blue, Size: L", stock: 5, threshold: 10, status: "Low Stock" },
  { name: "Silk Scarf", brand: "Fashion Trends", sku: "SKU00010", variant: "Color: Pink", stock: 22, threshold: 10, status: "In Stock" },
];

function InventoryManagementScreen() {
  const [inventoryItems, setInventoryItems] = useState(INVENTORY_ITEMS);
  const [adjustDialog, setAdjustDialog] = useState({ open: false, item: null });
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [quantity, setQuantity] = useState("0");
  const [reason, setReason] = useState("");

  const formattedDate = useMemo(() => new Intl.DateTimeFormat("en-CA").format(new Date()), []);

  const stats = useMemo(() => {
    const lowStock = inventoryItems.filter((item) => item.status === "Low Stock").length;
    const outOfStock = inventoryItems.filter((item) => item.stock <= 0).length;
    return { totalSkus: 32, lowStock, outOfStock };
  }, [inventoryItems]);

  const lowStockItem = useMemo(() => inventoryItems.find((item) => item.status === "Low Stock"), [inventoryItems]);

  const openAdjustDialog = (item) => {
    setAdjustmentType("add");
    setQuantity("0");
    setReason("");
    setAdjustDialog({ open: true, item });
  };

  const closeAdjustDialog = () => {
    setAdjustDialog({ open: false, item: null });
  };

  const applyAdjustment = () => {
    if (!adjustDialog.item) return;

    const qty = Number(quantity) || 0;
    if (qty < 0) return;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.sku !== adjustDialog.item.sku) return item;

        let nextStock = item.stock;
        if (adjustmentType === "add") nextStock = item.stock + qty;
        if (adjustmentType === "remove") nextStock = Math.max(item.stock - qty, 0);
        if (adjustmentType === "set") nextStock = qty;

        return {
          ...item,
          stock: nextStock,
          status: nextStock <= item.threshold ? "Low Stock" : "In Stock",
        };
      }),
    );

    closeAdjustDialog();
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

        {lowStockItem ? (
          <section className="low-stock-banner">
            <div className="low-stock-title-row">
              <span className="low-stock-icon">!</span>
              <h3>Low Stock Alerts</h3>
            </div>
            <div className="low-stock-item-row">
              <div className="low-stock-thumb">IMG</div>
              <div className="low-stock-text">
                <p>{lowStockItem.name}</p>
                <span>{lowStockItem.variant} | SKU: {lowStockItem.sku}</span>
              </div>
              <strong>{lowStockItem.stock} units left</strong>
              <button type="button" onClick={() => openAdjustDialog(lowStockItem)}>
                Restock
              </button>
            </div>
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
                {inventoryItems.map((item) => (
                  <tr key={item.sku}>
                    <td>
                      <div className="inventory-product-cell">
                        <div className="inventory-thumb">IMG</div>
                        <div>
                          <p className="inventory-product-name">{item.name}</p>
                          <p className="inventory-product-brand">{item.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td>{item.sku}</td>
                    <td>{item.variant}</td>
                    <td className="stock-value">{item.stock}</td>
                    <td>{item.threshold}</td>
                    <td>
                      <span className={`inventory-status ${item.status === "In Stock" ? "ok" : "low"}`}>{item.status}</span>
                    </td>
                    <td>
                      <button type="button" className="inventory-edit-btn" onClick={() => window.alert(`Edit ${item.sku}`)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
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
              <button type="button" className="adjust-apply-btn" onClick={applyAdjustment}>
                Apply Adjustment
              </button>
              <button type="button" className="adjust-cancel-btn" onClick={closeAdjustDialog}>
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
