import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import EditProductDialog from "./EditProductDialog.jsx";
import "./EditProductScreen.css";

const FALLBACK_PRODUCT = {
  productName: "Formal Oxfords",
  brand: "Classic Footwear",
  category: "Shoes",
  sku: "SKU21002",
  size: "",
  color: "Blue",
  description: "Product description...",
  sellingPrice: "$2360",
  currentStock: 5,
};

function EditProductScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState({ ...FALLBACK_PRODUCT, ...(location.state ?? {}) });
  const [tab, setTab] = useState("details");
  const [openDialog, setOpenDialog] = useState(Boolean(location.state?.openDialog));

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

  const stockStatus = product.currentStock === 0 ? "OUT OF STOCK" : product.currentStock < 10 ? "LOW STOCK" : "IN STOCK";

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
              <button type="button" className={tab === "details" ? "selected" : ""} onClick={() => setTab("details")}>
                Product Details
              </button>
              <button type="button" className={tab === "variant" ? "selected" : ""} onClick={() => setTab("variant")}>
                Variant Details
              </button>
              <button type="button" className={tab === "pricing" ? "selected" : ""} onClick={() => setTab("pricing")}>
                Pricing & Inventory
              </button>
            </section>

            {tab === "details" ? (
              <section className="edit-card">
                <h3>Product Information</h3>
                <div className="edit-grid">
                  <label>
                    Product Name
                    <input value={product.productName} onChange={(event) => setProduct((prev) => ({ ...prev, productName: event.target.value }))} />
                  </label>
                  <label>
                    Brand
                    <input value={product.brand} onChange={(event) => setProduct((prev) => ({ ...prev, brand: event.target.value }))} />
                  </label>
                </div>
                <div className="edit-grid">
                  <label>
                    Category
                    <input value={product.category} onChange={(event) => setProduct((prev) => ({ ...prev, category: event.target.value }))} />
                  </label>
                  <label>
                    SKU
                    <input value={product.sku} onChange={(event) => setProduct((prev) => ({ ...prev, sku: event.target.value }))} />
                  </label>
                </div>
                <label>
                  Description
                  <textarea value={product.description} onChange={(event) => setProduct((prev) => ({ ...prev, description: event.target.value }))} rows={4} />
                </label>
              </section>
            ) : null}

            {tab === "variant" ? (
              <section className="edit-card">
                <h3>Variant Details</h3>
                <div className="edit-grid">
                  <label>
                    Size
                    <input value={product.size} onChange={(event) => setProduct((prev) => ({ ...prev, size: event.target.value }))} />
                  </label>
                  <label>
                    Color
                    <input value={product.color} onChange={(event) => setProduct((prev) => ({ ...prev, color: event.target.value }))} />
                  </label>
                </div>
              </section>
            ) : null}

            {tab === "pricing" ? (
              <section className="edit-card">
                <h3>Pricing & Inventory</h3>
                <div className="edit-grid">
                  <label>
                    Selling Price
                    <input value={product.sellingPrice} onChange={(event) => setProduct((prev) => ({ ...prev, sellingPrice: event.target.value }))} />
                  </label>
                  <label>
                    Current Stock
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
                  </label>
                </div>
                <p className="stock-status">
                  Status: <strong>{stockStatus}</strong>
                </p>
              </section>
            ) : null}

            <section className="edit-actions">
              <button type="button" className="save-btn" onClick={() => window.alert(`Saved changes for ${product.productName}`)}>
                Save Changes
              </button>
              <button type="button" className="light-btn" onClick={() => setOpenDialog(true)}>
                Open Edit Dialog
              </button>
              <button type="button" className="cancel-btn" onClick={() => navigate("/low-stock-alerts")}>
                Cancel
              </button>
            </section>
          </div>

          <aside className="edit-side-col">
            <section className="edit-card">
              <h3>Product Preview</h3>
              <div className="preview-thumb">IMG</div>
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
                <strong>{product.sellingPrice}</strong>
              </div>
            </section>

            <section className="tips-card">
              <h3>Editing Tips</h3>
              <p>- Use clear, descriptive product names</p>
              <p>- Keep SKUs unique for easy tracking</p>
              <p>- Update prices carefully for active listings</p>
              <p>- Maintain detailed descriptions</p>
            </section>

            <section className="important-card">
              <h3>Important</h3>
              <p>Changes are reflected immediately on storefront and may affect active orders.</p>
            </section>
          </aside>
        </section>
      </main>

      {openDialog ? (
        <EditProductDialog
          initialProduct={product}
          onClose={() => setOpenDialog(false)}
          onSave={(payload) => {
            setProduct((prev) => ({
              ...prev,
              productName: payload.productName,
              brand: payload.brand,
              category: payload.category,
              description: payload.description,
              currentStock: payload.currentStock,
            }));
            setOpenDialog(false);
          }}
        />
      ) : null}
    </SellerLayout>
  );
}

export default EditProductScreen;
