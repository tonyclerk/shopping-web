import { useMemo, useState } from "react";
import "./EditProductScreen.css";

const EMPTY_VARIANT = {
  sku: "",
  color: "",
  size: "",
  stock: "0",
  mrp: "0",
  basePrice: "0",
  discount: "0",
};

const CATEGORY_OPTIONS = ["Accessories", "Clothing", "Shoes", "Watches", "Eyewear", "Bags", "Beauty"];

const SUBCATEGORY_OPTIONS = {
  Accessories: ["Jewelry", "Belts", "Wallets"],
  Shoes: ["Sneakers", "Boots", "Heels", "Sandals", "Loafers"],
  Watches: ["Luxury", "Smartwatch", "Sports", "Casual", "Chronograph"],
  Eyewear: ["Sunglasses", "Reading", "Blue Light", "Aviator", "Round"],
  Bags: ["Handbags", "Backpacks", "Tote Bags", "Crossbody", "Travel"],
  Beauty: ["Skincare", "Makeup", "Haircare", "Fragrance", "Nails"],
};

const CLOTHING_SUBCATEGORY_OPTIONS = {
  men: ["Shirts", "T-Shirts", "Pants", "Outerwear", "Jeans"],
  women: ["Dresses", "Tops", "Skirts", "Outerwear", "Jeans"],
};

function EditProductDialog({ initialProduct, onClose, onSave }) {
  const [name, setName] = useState(initialProduct.productName ?? "");
  const [description, setDescription] = useState(initialProduct.description ?? "Product description...");
  const [category, setCategory] = useState(initialProduct.category ?? "Accessories");
  const [gender, setGender] = useState(initialProduct.gender ?? "");
  const [subcategory, setSubcategory] = useState(initialProduct.subcategory ?? "");
  const [brand, setBrand] = useState(initialProduct.brand ?? "");
  const [variants, setVariants] = useState([
    { ...EMPTY_VARIANT, sku: initialProduct.sku ?? "SKU00001", color: initialProduct.color ?? "Blue", stock: String(initialProduct.currentStock ?? 0), mrp: "2999", basePrice: "2499", discount: "15" },
    { ...EMPTY_VARIANT, sku: "SKU00002", color: "Black", stock: "31", mrp: "2999", basePrice: "2499", discount: "15" },
  ]);

  const totalStock = useMemo(() => variants.reduce((sum, item) => sum + (Number(item.stock) || 0), 0), [variants]);

  const subcategoryOptions = useMemo(() => {
    if (!category) return [];

    if (category === "Clothing") {
      if (gender === "men" || gender === "women") return CLOTHING_SUBCATEGORY_OPTIONS[gender];
      if (gender === "unisex") {
        return [...new Set([...CLOTHING_SUBCATEGORY_OPTIONS.men, ...CLOTHING_SUBCATEGORY_OPTIONS.women])];
      }
      return [];
    }

    return SUBCATEGORY_OPTIONS[category] ?? [];
  }, [category, gender]);

  const selectedSubcategory = subcategoryOptions.includes(subcategory) ? subcategory : "";

  const finalPrice = (variant) => {
    const basePrice = Number(variant.basePrice) || 0;
    const discount = Number(variant.discount) || 0;
    return (basePrice - (basePrice * discount) / 100).toFixed(2);
  };

  const updateVariant = (index, key, value) => {
    setVariants((prev) => prev.map((variant, variantIndex) => (variantIndex === index ? { ...variant, [key]: value } : variant)));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) {
      window.alert("Product name is required.");
      return;
    }
    if (!gender) {
      window.alert("Please select a gender/audience.");
      return;
    }
    if (!selectedSubcategory) {
      window.alert("Subcategory is required.");
      return;
    }

    onSave({
      productName: name.trim(),
      description: description.trim(),
      category,
      gender,
      subcategory: selectedSubcategory,
      brand: brand.trim(),
      variants,
      currentStock: totalStock,
    });
  };

  return (
    <div className="edit-dialog-overlay" onClick={onClose}>
      <div className="edit-dialog-card" onClick={(event) => event.stopPropagation()}>
        <div className="edit-dialog-header">
          <div>
            <h3>Edit Product</h3>
            <p>Update product details</p>
          </div>
          <button type="button" onClick={onClose}>
            x
          </button>
        </div>

        <form className="edit-dialog-body" onSubmit={submit}>
          <label>
            Product Name *
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </label>

          <div className="edit-dialog-grid">
            <label>
              Category *
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setSubcategory("");
                }}
              >
                {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Brand
              <input value={brand} onChange={(event) => setBrand(event.target.value)} />
            </label>
          </div>

          <div className="edit-dialog-grid">
            <label>
              Gender / Audience *
              <select
                value={gender}
                onChange={(event) => {
                  setGender(event.target.value);
                  setSubcategory("");
                }}
              >
                <option value="">Select audience</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
            </label>
            <label>
              Subcategory *
              <select
                value={selectedSubcategory}
                onChange={(event) => setSubcategory(event.target.value)}
                disabled={!subcategoryOptions.length}
              >
                <option value="">
                  {category === "Clothing" && !gender ? "Select audience first" : "Select subcategory"}
                </option>
                {subcategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>

          {variants.map((variant, index) => (
            <section className="edit-variant-card" key={`${variant.sku}-${index}`}>
              <h4>Variant {index + 1}</h4>
              <div className="edit-dialog-grid">
                <label>
                  SKU
                  <input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} />
                </label>
                <label>
                  Color
                  <input value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} />
                </label>
              </div>
              <div className="edit-dialog-grid">
                <label>
                  Size
                  <input value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} />
                </label>
                <label>
                  Stock
                  <input value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} inputMode="numeric" />
                </label>
              </div>
              <div className="edit-dialog-grid">
                <label>
                  MRP
                  <input value={variant.mrp} onChange={(event) => updateVariant(index, "mrp", event.target.value)} inputMode="decimal" />
                </label>
                <label>
                  Base Price
                  <input value={variant.basePrice} onChange={(event) => updateVariant(index, "basePrice", event.target.value)} inputMode="decimal" />
                </label>
              </div>
              <div className="edit-dialog-grid">
                <label>
                  Discount (%)
                  <input value={variant.discount} onChange={(event) => updateVariant(index, "discount", event.target.value)} inputMode="decimal" />
                </label>
                <label>
                  Final Price
                  <div className="readonly-box">{finalPrice(variant)}</div>
                </label>
              </div>
            </section>
          ))}

          <div className="edit-dialog-actions">
            <button type="submit" className="save-btn">
              Update Product
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductDialog;
