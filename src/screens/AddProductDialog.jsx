import { useMemo, useState } from "react";

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

  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0),
    [variants],
  );

  const updateVariant = (index, key, value) => {
    setVariants((prev) => prev.map((variant, variantIndex) => (variantIndex === index ? { ...variant, [key]: value } : variant)));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createVariant()]);
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

    if (!category) {
      window.alert("Category is required.");
      return;
    }

    onSubmit({
      name: name.trim(),
      brand: brand.trim() || "Brand",
      category,
      status: "draft",
      variants: variants.length,
      stock: `${totalStock} units`,
      description: description.trim() || "Product description...",
      imageUrl: imageUrl.trim(),
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-card add-product-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div>
            <h3>Add New Product</h3>
            <p>Create a new product listing</p>
          </div>
          <button type="button" className="dialog-close" onClick={onClose}>
            x
          </button>
        </div>

        <form className="dialog-body" onSubmit={submit}>
          <label>
            Product Name *
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g., Premium Leather Wallet" />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Product description..." />
          </label>

          <div className="dialog-grid-2">
            <label>
              Category *
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Brand
              <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Brand name" />
            </label>
          </div>

          <label>
            Cover Image URL
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/image.jpg" />
          </label>

          <div className="dialog-divider" />

          <div className="dialog-variants-head no-top-border">
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
                  <input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} placeholder="SKU1768654441088" />
                </label>
                <label>
                  Color
                  <input value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} placeholder="Color" />
                </label>
              </div>

              <div className="dialog-grid-2">
                <label>
                  Size
                  <input value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} placeholder="Size" />
                </label>
                <label>
                  Stock
                  <input
                    value={variant.stock}
                    onChange={(event) => updateVariant(index, "stock", event.target.value)}
                    inputMode="numeric"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="dialog-grid-2">
                <label>
                  MRP
                  <input value={variant.mrp} onChange={(event) => updateVariant(index, "mrp", event.target.value)} inputMode="decimal" placeholder="0" />
                </label>
                <label>
                  Base Price
                  <input
                    value={variant.basePrice}
                    onChange={(event) => updateVariant(index, "basePrice", event.target.value)}
                    inputMode="decimal"
                    placeholder="0"
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
                    placeholder="0"
                  />
                </label>
                <label>
                  Final Price
                  <div className="readonly-value">{finalPrice(variant)}</div>
                </label>
              </div>
            </section>
          ))}

          <button type="submit" className="submit-btn">
            Create Product
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddProductDialog;
