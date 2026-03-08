import react, { useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase"; // 👈 adjust path to your firebase config

const EMPTY_VARIANT = {
  sku: "",
  color: "",
  size: "",
  stock: "0",
  mrp: "0",
  basePrice: "0",
  discount: "0",
};

const CATEGORY_OPTIONS = ["Accessories", "Clothing", "Shoes", "Watches"];

const createVariant = () => ({ ...EMPTY_VARIANT, sku: `SKU${Date.now()}` });

function AddProductDialog({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [variants, setVariants] = useState([createVariant()]);
  const [loading, setLoading] = useState(false);

  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0),
    [variants],
  );

  const updateVariant = (index, key, value) => {
    setVariants((prev) =>
      prev.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant
      )
    );
  };

  const addVariant = () => setVariants((prev) => [...prev, createVariant()]);

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const finalPrice = (variant) => {
    const basePrice = Number(variant.basePrice) || 0;
    const discount = Number(variant.discount) || 0;
    return (basePrice - (basePrice * discount) / 100).toFixed(2);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!name.trim()) return window.alert("Product name is required.");
    if (!category) return window.alert("Category is required.");

    const seller = auth.currentUser;
    if (!seller) return window.alert("You must be logged in to add a product.");

    setLoading(true);
    try {
      // Shape the variants cleanly with numbers, not strings
      const cleanVariants = variants.map((v) => ({
        sku: v.sku.trim(),
        color: v.color.trim(),
        size: v.size.trim(),
        stock: Number(v.stock) || 0,
        mrp: Number(v.mrp) || 0,
        basePrice: Number(v.basePrice) || 0,
        discount: Number(v.discount) || 0,
        finalPrice: parseFloat(finalPrice(v)),
      }));

      const productData = {
        title: name.trim(),                        // was: name
  description: description.trim() || "",
  category,
  brand: brand.trim() || "",
  image: imageUrl.trim() || "",              // was: imageUrl
  status: "draft",
  stock: totalStock > 0 ? `${totalStock} units` : null,  // string, e.g. "50 units"
  variantCount: variants.length,
  variants: cleanVariants,
  
  // Top-level price fields pulled from first variant (what mobile reads)
  price: parseFloat(finalPrice(variants[0])),           
  originalPrice: Number(variants[0].mrp) || 0,         
  discount: variants[0].discount ? `${variants[0].discount}%` : undefined,  // string like "10%"

  rating: 0,          // default, updated later from reviews
  reviews: 0,         // default

  sellerId: seller.uid,
  sellerEmail: seller.email,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "products"), productData);

      // Pass back to parent with the new Firestore doc ID
      onSubmit({ id: docRef.id, ...productData });
      onClose();
    } catch (error) {
      console.error("Error adding product:", error);
      window.alert("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-card add-product-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div>
            <h3>Add New Product</h3>
            <p>Create a new product listing</p>
          </div>
          <button type="button" className="dialog-close" onClick={onClose}>x</button>
        </div>

        <form className="dialog-body" onSubmit={submit}>
          <label>
            Product Name *
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Premium Leather Wallet" />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Product description..." />
          </label>

          <div className="dialog-grid-2">
            <label>
              Category *
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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

          <div className="dialog-divider" />

          <div className="dialog-variants-head no-top-border">
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
                <label>SKU<input value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} placeholder="SKU..." /></label>
                <label>Color<input value={variant.color} onChange={(e) => updateVariant(index, "color", e.target.value)} placeholder="Color" /></label>
              </div>
              <div className="dialog-grid-2">
                <label>Size<input value={variant.size} onChange={(e) => updateVariant(index, "size", e.target.value)} placeholder="Size" /></label>
                <label>Stock<input value={variant.stock} onChange={(e) => updateVariant(index, "stock", e.target.value)} inputMode="numeric" placeholder="0" /></label>
              </div>
              <div className="dialog-grid-2">
                <label>MRP<input value={variant.mrp} onChange={(e) => updateVariant(index, "mrp", e.target.value)} inputMode="decimal" placeholder="0" /></label>
                <label>Base Price<input value={variant.basePrice} onChange={(e) => updateVariant(index, "basePrice", e.target.value)} inputMode="decimal" placeholder="0" /></label>
              </div>
              <div className="dialog-grid-2">
                <label>Discount (%)<input value={variant.discount} onChange={(e) => updateVariant(index, "discount", e.target.value)} inputMode="decimal" placeholder="0" /></label>
                <label>Final Price<div className="readonly-value">{finalPrice(variant)}</div></label>
              </div>
            </section>
          ))}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Saving..." : "Create Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddProductDialog;