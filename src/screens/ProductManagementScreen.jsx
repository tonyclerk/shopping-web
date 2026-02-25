import { useMemo, useState } from "react";
import SellerLayout from "../components/SellerLayout.jsx";
import AddProductDialog from "./AddProductDialog.jsx";
import "./ProductManagementScreen.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "approved", label: "Approved" },
  { key: "submitted", label: "Submitted" },
  { key: "draft", label: "Draft" },
];

const INITIAL_PRODUCTS = [
  { id: "P-1001", name: "Leather Belt", brand: "Brand 1", category: "Accessories", variants: 2, status: "live", stock: "94 units" },
  { id: "P-1002", name: "Canvas Backpack", brand: "Brand 2", category: "Accessories", variants: 2, status: "approved", stock: "156 units" },
  { id: "P-1003", name: "Aviator Sunglasses", brand: "Brand 3", category: "Accessories", variants: 2, status: "submitted", stock: "132 units" },
  { id: "P-1004", name: "Leather Wallet", brand: "Brand 4", category: "Accessories", variants: 2, status: "draft", stock: "93 units" },
  { id: "P-1005", name: "Cotton T-Shirt", brand: "Brand 1", category: "Clothing", variants: 2, status: "live", stock: "88 units" },
  { id: "P-1006", name: "Denim Jeans", brand: "Brand 2", category: "Clothing", variants: 2, status: "approved", stock: "87 units" },
  { id: "P-1007", name: "Formal Shirt", brand: "Brand 3", category: "Clothing", variants: 2, status: "submitted", stock: "160 units" },
  { id: "P-1008", name: "Casual Hoodie", brand: "Brand 4", category: "Clothing", variants: 2, status: "draft", stock: "96 units" },
  { id: "P-1009", name: "Running Shoes", brand: "Brand 1", category: "Shoes", variants: 2, status: "live", stock: "63 units" },
  { id: "P-1010", name: "Formal Oxfords", brand: "Brand 2", category: "Shoes", variants: 2, status: "approved", stock: "74 units" },
  { id: "P-1011", name: "Casual Sneakers", brand: "Brand 3", category: "Shoes", variants: 2, status: "submitted", stock: "94 units" },
  { id: "P-1012", name: "Leather Boots", brand: "Brand 4", category: "Shoes", variants: 2, status: "draft", stock: "90 units" },
  { id: "P-1013", name: "Smart Watch Pro", brand: "Brand 1", category: "Watches", variants: 2, status: "live", stock: "69 units" },
  { id: "P-1014", name: "Classic Analog", brand: "Brand 2", category: "Watches", variants: 2, status: "approved", stock: "131 units" },
  { id: "P-1015", name: "Digital Sports", brand: "Brand 3", category: "Watches", variants: 2, status: "submitted", stock: "71 units" },
  { id: "P-1016", name: "Luxury Chronograph", brand: "Brand 4", category: "Watches", variants: 2, status: "draft", stock: "98 units" },
];

const STATUS_STYLE = {
  live: { background: "#DCFCE7", color: "#016630" },
  approved: { background: "#DBEAFE", color: "#193CB8" },
  submitted: { background: "#FEF9C2", color: "#894B00" },
  draft: { background: "#F3F4F6", color: "#1E2939" },
};

const EMPTY_VARIANT = {
  sku: "",
  color: "",
  size: "",
  stock: "0",
  mrp: "0",
  basePrice: "0",
  discount: "0",
};

function ProductManagementScreen() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [dialogState, setDialogState] = useState({ mode: null, product: null });

  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()),
    [],
  );

  const counts = useMemo(() => {
    const result = { all: products.length, live: 0, approved: 0, submitted: 0, draft: 0 };
    products.forEach((item) => {
      result[item.status] += 1;
    });
    return result;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedTab === "all") return products;
    return products.filter((product) => product.status === selectedTab);
  }, [products, selectedTab]);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDialogSubmit = (payload) => {
    if (dialogState.mode === "add") {
      const id = `P-${Math.floor(1000 + Math.random() * 9000)}`;
      setProducts((prev) => [{ id, ...payload }, ...prev]);
    }

    if (dialogState.mode === "edit" && dialogState.product) {
      setProducts((prev) => prev.map((item) => (item.id === dialogState.product.id ? { ...item, ...payload } : item)));
    }

    setDialogState({ mode: null, product: null });
  };

  return (
    <SellerLayout selectedMenu="Products" title="Products" subtitle={formattedDate} contentClassName="no-pad">
      <main className="product-content">
        <section className="product-page-head">
          <div>
            <h2>Product Management</h2>
            <p>Manage your product catalog</p>
          </div>
          <button type="button" className="product-add-btn" onClick={() => setDialogState({ mode: "add", product: null })}>
            + Add Product
          </button>
        </section>

        <section className="product-tabs">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={`product-tab ${tab.key === selectedTab ? "selected" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </section>

        <section className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Status</th>
                <th>Stock</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const badge = STATUS_STYLE[product.status] ?? STATUS_STYLE.draft;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell-main">
                        <div className="product-thumb">IMG</div>
                        <div>
                          <p className="product-name">{product.name}</p>
                          <p className="product-brand">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.variants}</td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: badge.background, color: badge.color }}>
                        {product.status}
                      </span>
                    </td>
                    <td>{product.stock}</td>
                    <td className="align-right">
                      <button type="button" className="table-action" onClick={() => setDialogState({ mode: "edit", product })}>
                        Edit
                      </button>
                      <button type="button" className="table-action danger" onClick={() => handleDelete(product.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>

      {dialogState.mode === "add" ? (
        <AddProductDialog onClose={() => setDialogState({ mode: null, product: null })} onSubmit={handleDialogSubmit} />
      ) : null}

      {dialogState.mode === "edit" ? (
        <ProductDialog
          mode={dialogState.mode}
          initialProduct={dialogState.product}
          onClose={() => setDialogState({ mode: null, product: null })}
          onSubmit={handleDialogSubmit}
        />
      ) : null}
    </SellerLayout>
  );
}

function ProductDialog({ mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState("Product description...");
  const [category, setCategory] = useState(initialProduct?.category ?? "Accessories");
  const [brand, setBrand] = useState(initialProduct?.brand ?? "");
  const [status, setStatus] = useState(initialProduct?.status ?? "draft");
  const [stock, setStock] = useState(initialProduct?.stock?.replace(" units", "") ?? "0");
  const [variants, setVariants] = useState([
    { ...EMPTY_VARIANT, sku: "SKU00001", color: "Black", stock: "63", mrp: "2999", basePrice: "2499", discount: "15" },
    ...(mode === "edit" ? [{ ...EMPTY_VARIANT, sku: "SKU00002", color: "Blue", stock: "31", mrp: "2999", basePrice: "2499", discount: "15" }] : []),
  ]);

  const updateVariant = (index, key, value) => {
    setVariants((prev) => prev.map((variant, variantIndex) => (variantIndex === index ? { ...variant, [key]: value } : variant)));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT, sku: `SKU${Date.now()}` }]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, variantIndex) => variantIndex !== index));
  };

  const finalPrice = (variant) => {
    const basePrice = Number(variant.basePrice) || 0;
    const discount = Number(variant.discount) || 0;
    return (basePrice - (basePrice * discount) / 100).toFixed(2);
  };

  const submit = (event) => {
    event.preventDefault();

    if (!name.trim()) {
      window.alert("Product name is required.");
      return;
    }

    onSubmit({
      name: name.trim(),
      brand: brand.trim() || "Brand",
      category,
      status,
      variants: variants.length,
      stock: `${stock || 0} units`,
      description,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-card" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div>
            <h3>{mode === "add" ? "Add New Product" : "Edit Product"}</h3>
            <p>{mode === "add" ? "Create a new product listing" : "Update product details"}</p>
          </div>
          <button type="button" className="dialog-close" onClick={onClose}>
            x
          </button>
        </div>

        <form className="dialog-body" onSubmit={submit}>
          <label>
            Product Name *
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Premium Leather Wallet" />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </label>

          <div className="dialog-grid-2">
            <label>
              Category *
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>Accessories</option>
                <option>Clothing</option>
                <option>Shoes</option>
                <option>Watches</option>
              </select>
            </label>

            <label>
              Brand
              <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Brand name" />
            </label>
          </div>

          <div className="dialog-grid-2">
            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="live">Live</option>
                <option value="approved">Approved</option>
                <option value="submitted">Submitted</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label>
              Total Stock
              <input value={stock} onChange={(event) => setStock(event.target.value)} inputMode="numeric" />
            </label>
          </div>

          <div className="dialog-variants-head">
            <h4>Product Variants</h4>
            <button type="button" className="light-btn" onClick={addVariant}>
              + Add Variant
            </button>
          </div>

          {variants.map((variant, index) => (
            <section className="variant-card" key={`${variant.sku}-${index}`}>
              <div className="variant-head">
                <h5>Variant {index + 1}</h5>
                <button type="button" className="danger-link" onClick={() => removeVariant(index)}>
                  Delete
                </button>
              </div>

              <div className="dialog-grid-2">
                <label>
                  SKU
                  <input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} />
                </label>
                <label>
                  Color
                  <input value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} />
                </label>
              </div>

              <div className="dialog-grid-2">
                <label>
                  Size
                  <input value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} />
                </label>
                <label>
                  Stock
                  <input value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} inputMode="numeric" />
                </label>
              </div>

              <div className="dialog-grid-2">
                <label>
                  MRP
                  <input value={variant.mrp} onChange={(event) => updateVariant(index, "mrp", event.target.value)} inputMode="decimal" />
                </label>
                <label>
                  Base Price
                  <input
                    value={variant.basePrice}
                    onChange={(event) => updateVariant(index, "basePrice", event.target.value)}
                    inputMode="decimal"
                  />
                </label>
              </div>

              <div className="dialog-grid-2">
                <label>
                  Discount (%)
                  <input
                    value={variant.discount}
                    onChange={(event) => updateVariant(index, "discount", event.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label>
                  Final Price
                  <input value={finalPrice(variant)} readOnly />
                </label>
              </div>
            </section>
          ))}

          <button type="submit" className="submit-btn">
            {mode === "add" ? "Create Product" : "Update Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductManagementScreen;
