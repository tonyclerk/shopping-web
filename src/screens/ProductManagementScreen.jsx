import { useMemo, useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
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

// Hardcoded products stay as-is — flagged with source: "local"


const STATUS_STYLE = {
  live:      { background: "#DCFCE7", color: "#016630" },
  approved:  { background: "#DBEAFE", color: "#193CB8" },
  submitted: { background: "#FEF9C2", color: "#894B00" },
  draft:     { background: "#F3F4F6", color: "#1E2939" },
};

const EMPTY_VARIANT = {
  sku: "", color: "", size: "",
  stock: "0", mrp: "0", basePrice: "0", discount: "0",
};

// ─── Helper: normalize a Firestore doc into table row shape ───────────────────
const normalizeFirestoreProduct = (docSnap) => {
  const d = docSnap.data();
  return {
    id:        docSnap.id,
    name:      d.title  ?? d.name ?? "",   // mobile uses "title", dialog saves "title"
    brand:     d.brand  ?? "",
    category:  d.category ?? "",
    variants:  d.variantCount ?? (d.variants?.length ?? 0),
    status:    d.status ?? "draft",
    stock:     d.stock  ?? "0 units",
    imageUrl:  d.image  ?? "",
    source:    "firestore",                // flag so we know it's editable/deletable
    _raw:      d,                          // keep full data for the edit dialog
  };
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
function ProductManagementScreen() {
  const [selectedTab, setSelectedTab]   = useState("all");
  const [fbProducts, setFbProducts]     = useState([]);   // from Firestore
  const [dialogState, setDialogState]   = useState({ mode: null, product: null });

  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()),
    [],
  );

  // ── Real-time Firestore listener ───────────────────────────────────────────
 // Replace your existing useEffect with this
useEffect(() => {
  let unsubscribeProducts = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (seller) => {
    if (unsubscribeProducts) {
      unsubscribeProducts();
      unsubscribeProducts = null;
    }

    if (!seller) {
      setFbProducts([]);
      return;
    }

    const q = query(
      collection(db, "products"),
      where("sellerId", "==", seller.uid),
    );

    unsubscribeProducts = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs.map(normalizeFirestoreProduct);
        rows.sort((a, b) => {
          const aMs = a?._raw?.createdAt?.toMillis?.() ?? 0;
          const bMs = b?._raw?.createdAt?.toMillis?.() ?? 0;
          return bMs - aMs;
        });
        setFbProducts(rows);
      },
      (err) => {
        console.error("Products listener failed:", err);
        setFbProducts([]);
      },
    );
  });

  return () => {
    if (unsubscribeProducts) unsubscribeProducts();
    unsubscribeAuth();
  };
}, []);

  // Firestore products on top, hardcoded below
  const products = useMemo(() => fbProducts, [fbProducts]);

  const counts = useMemo(() => {
    const result = { all: products.length, live: 0, approved: 0, submitted: 0, draft: 0 };
    products.forEach((p) => { if (result[p.status] !== undefined) result[p.status] += 1; });
    return result;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedTab === "all") return products;
    return products.filter((p) => p.status === selectedTab);
  }, [products, selectedTab]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (product) => {
    if (!window.confirm("Delete this product?")) return;

    if (product.source === "firestore") {
      try {
        await deleteDoc(doc(db, "products", product.id));
        // onSnapshot will auto-remove it from fbProducts
      } catch (err) {
        console.error("Delete failed:", err);
        window.alert("Failed to delete product.");
      }
    }
    // Hardcoded products: do nothing (or you can remove from local state if you want)
  };

  // ── Add / Edit submit ──────────────────────────────────────────────────────
  const handleDialogSubmit = async (payload) => {
    const seller = auth.currentUser;

    if (dialogState.mode === "add") {
      try {
        await addDoc(collection(db, "products"), {
          ...payload,
          sellerId:    seller?.uid   ?? "",
          sellerEmail: seller?.email ?? "",
          createdAt:   serverTimestamp(),
          updatedAt:   serverTimestamp(),
        });
        // onSnapshot adds it to fbProducts automatically
      } catch (err) {
        console.error("Add failed:", err);
        window.alert("Failed to save product.");
        return;
      }
    }

    if (dialogState.mode === "edit" && dialogState.product?.source === "firestore") {
      try {
        await updateDoc(doc(db, "products", dialogState.product.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        // onSnapshot updates fbProducts automatically
      } catch (err) {
        console.error("Update failed:", err);
        window.alert("Failed to update product.");
        return;
      }
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
                const badge     = STATUS_STYLE[product.status] ?? STATUS_STYLE.draft;
                const isLocal   = product.source === "local";
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell-main">
                        <div className="product-thumb">
                          {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                            : "IMG"}
                        </div>
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
                      <button
                        type="button"
                        className="table-action"
                        disabled={isLocal}
                        title={isLocal ? "Hardcoded product — edit not available" : "Edit"}
                        onClick={() => !isLocal && setDialogState({ mode: "edit", product })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-action danger"
                        disabled={isLocal}
                        title={isLocal ? "Hardcoded product — delete not available" : "Delete"}
                        onClick={() => !isLocal && handleDelete(product)}
                      >
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

      {dialogState.mode === "add" && (
        <AddProductDialog
          onClose={() => setDialogState({ mode: null, product: null })}
          onSubmit={handleDialogSubmit}
        />
      )}

      {dialogState.mode === "edit" && dialogState.product && (
        <ProductDialog
          mode="edit"
          initialProduct={dialogState.product}
          onClose={() => setDialogState({ mode: null, product: null })}
          onSubmit={handleDialogSubmit}
        />
      )}
    </SellerLayout>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
function ProductDialog({ mode, initialProduct, onClose, onSubmit }) {
  const raw = initialProduct?._raw ?? {};

  const [name,        setName]        = useState(initialProduct?.name     ?? "");
  const [description, setDescription] = useState(raw.description          ?? "");
  const [category,    setCategory]    = useState(initialProduct?.category  ?? "Accessories");
  const [brand,       setBrand]       = useState(initialProduct?.brand     ?? "");
  const [imageUrl,    setImageUrl]    = useState(raw.image                 ?? "");
  const [status,      setStatus]      = useState(initialProduct?.status    ?? "draft");
  const [variants,    setVariants]    = useState(() => {
    if (raw.variants?.length) {
      return raw.variants.map((v) => ({
        sku:       String(v.sku       ?? ""),
        color:     String(v.color     ?? ""),
        size:      String(v.size      ?? ""),
        stock:     String(v.stock     ?? "0"),
        mrp:       String(v.mrp       ?? "0"),
        basePrice: String(v.basePrice ?? "0"),
        discount:  String(v.discount  ?? "0"),
      }));
    }
    return [{ ...EMPTY_VARIANT, sku: "SKU00001" }];
  });

  const totalStock = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants],
  );

  const updateVariant = (index, key, value) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)));

  const addVariant = () =>
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT, sku: `SKU${Date.now()}` }]);

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const finalPrice = (v) => {
    const base = Number(v.basePrice) || 0;
    const disc = Number(v.discount)  || 0;
    return (base - (base * disc) / 100).toFixed(2);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return window.alert("Product name is required.");

    const cleanVariants = variants.map((v) => ({
      sku:        v.sku.trim(),
      color:      v.color.trim(),
      size:       v.size.trim(),
      stock:      Number(v.stock)     || 0,
      mrp:        Number(v.mrp)       || 0,
      basePrice:  Number(v.basePrice) || 0,
      discount:   Number(v.discount)  || 0,
      finalPrice: parseFloat(finalPrice(v)),
    }));

    onSubmit({
      title:         name.trim(),                       // mobile reads "title"
      name:          name.trim(),                       // table reads "name"
      brand:         brand.trim() || "",
      category,
      status,
      image:         imageUrl.trim() || "",
      description:   description.trim() || "",
      variants:      cleanVariants,
      variantCount:  variants.length,
      stock:         totalStock > 0 ? `${totalStock} units` : null,
      price:         parseFloat(finalPrice(variants[0])),
      originalPrice: Number(variants[0].mrp) || 0,
      discount:      variants[0].discount ? `${variants[0].discount}%` : undefined,
      rating:        raw.rating  ?? 0,
      reviews:       raw.reviews ?? 0,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div>
            <h3>Edit Product</h3>
            <p>Update product details</p>
          </div>
          <button type="button" className="dialog-close" onClick={onClose}>x</button>
        </div>

        <form className="dialog-body" onSubmit={submit}>
          <label>
            Product Name *
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Premium Leather Wallet" />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>

          <div className="dialog-grid-2">
            <label>
              Category *
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Accessories</option>
                <option>Clothing</option>
                <option>Shoes</option>
                <option>Watches</option>
              </select>
            </label>
            <label>
              Brand
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name" />
            </label>
          </div>

          <label>
            Cover Image URL
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </label>

          <div className="dialog-grid-2">
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="live">Live</option>
                <option value="approved">Approved</option>
                <option value="submitted">Submitted</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <label>
              Total Stock
              <div className="readonly-value">{totalStock} units (auto-calculated)</div>
            </label>
          </div>

          <div className="dialog-divider" />

          <div className="dialog-variants-head">
            <h4>Product Variants</h4>
            <button type="button" className="light-btn" onClick={addVariant}>+ Add Variant</button>
          </div>

          {variants.map((variant, index) => (
            <section className="variant-card" key={`${variant.sku}-${index}`}>
              <div className="variant-head">
                <h5>Variant {index + 1}</h5>
                <button type="button" className="danger-link" onClick={() => removeVariant(index)}>Delete</button>
              </div>
              <div className="dialog-grid-2">
                <label>SKU<input value={variant.sku}       onChange={(e) => updateVariant(index, "sku",       e.target.value)} /></label>
                <label>Color<input value={variant.color}   onChange={(e) => updateVariant(index, "color",     e.target.value)} /></label>
              </div>
              <div className="dialog-grid-2">
                <label>Size<input value={variant.size}     onChange={(e) => updateVariant(index, "size",      e.target.value)} /></label>
                <label>Stock<input value={variant.stock}   onChange={(e) => updateVariant(index, "stock",     e.target.value)} inputMode="numeric" /></label>
              </div>
              <div className="dialog-grid-2">
                <label>MRP<input value={variant.mrp}       onChange={(e) => updateVariant(index, "mrp",       e.target.value)} inputMode="decimal" /></label>
                <label>Base Price<input value={variant.basePrice} onChange={(e) => updateVariant(index, "basePrice", e.target.value)} inputMode="decimal" /></label>
              </div>
              <div className="dialog-grid-2">
                <label>Discount (%)<input value={variant.discount} onChange={(e) => updateVariant(index, "discount", e.target.value)} inputMode="decimal" /></label>
                <label>Final Price<div className="readonly-value">{finalPrice(variant)}</div></label>
              </div>
            </section>
          ))}

          <button type="submit" className="submit-btn">Update Product</button>
        </form>
      </div>
    </div>
  );
}

export default ProductManagementScreen;
