import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "../firebase";

const EMPTY_VARIANT = {
  sku: "",
  color: "",
  size: "",
  stock: "0",
  price: "0",
  discount: "0",
  limitedTimeOffer: false,
  finalPrice: "0",
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

const createVariant = () => ({ ...EMPTY_VARIANT, sku: `SKU${Date.now()}` });

const parseNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
};

const formatNumber = (value) => {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  return Number.isFinite(rounded) ? String(rounded) : "0";
};

function AddProductDialog({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [variants, setVariants] = useState([createVariant()]);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState("");
  const [subcategory, setSubcategory] = useState("");

  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0),
    [variants],
  );

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

  useEffect(() => {
    if (subcategory && !subcategoryOptions.includes(subcategory)) {
      setSubcategory("");
    }
  }, [subcategory, subcategoryOptions]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const updateVariant = (index, key, value) => {
    setVariants((prev) =>
      prev.map((variant, variantIndex) => {
        if (variantIndex !== index) return variant;

        if (key === "price") {
          const price = parseNumber(value);
          const discount = parseNumber(variant.discount);
          const finalPrice = Math.max(price - (price * discount) / 100, 0);
          return {
            ...variant,
            price: value,
            finalPrice: formatNumber(finalPrice),
          };
        }

        if (key === "discount") {
          const price = parseNumber(variant.price);
          const discount = Math.max(parseNumber(value), 0);
          const finalPrice = Math.max(price - (price * discount) / 100, 0);
          return {
            ...variant,
            discount: value,
            limitedTimeOffer: discount > 0 ? variant.limitedTimeOffer : false,
            finalPrice: formatNumber(finalPrice),
          };
        }

        if (key === "finalPrice") {
          const price = parseNumber(variant.price);
          const finalPrice = Math.max(parseNumber(value), 0);
          const discount = price > 0 ? Math.max(((price - finalPrice) / price) * 100, 0) : 0;
          return {
            ...variant,
            finalPrice: value,
            discount: formatNumber(discount),
          };
        }

        return { ...variant, [key]: value };
      }),
    );
  };

  const addVariant = () => setVariants((prev) => [...prev, createVariant()]);

  const removeVariant = (index) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageFileChange = (event) => {
    const [file] = event.target.files ?? [];
    setImageFile(file ?? null);
  };

  const clearSelectedImageFile = () => {
    setImageFile(null);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!name.trim()) return window.alert("Product name is required.");
    if (!category) return window.alert("Category is required.");
    if (!gender) {
      window.alert("Please select a gender/audience.");
      return;
    }
    if (!subcategory) return window.alert("Subcategory is required.");

    if (loading) return;

    setLoading(true);
    try {
      let resolvedImageUrl = imageUrl.trim();

      if (imageFile) {
        const sellerId = auth.currentUser?.uid ?? "anonymous";
        const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storageRef = ref(
          storage,
          `product-images/${sellerId}/${Date.now()}-${sanitizedFileName}`,
        );

        await uploadBytes(storageRef, imageFile, { contentType: imageFile.type });
        resolvedImageUrl = await getDownloadURL(storageRef);
      }

      const cleanVariants = variants.map((variant) => {
        const price = parseNumber(variant.price);
        const discount = parseNumber(variant.discount);
        const finalPrice = parseNumber(variant.finalPrice);

        return {
          sku: variant.sku.trim(),
          color: variant.color.trim(),
          size: variant.size.trim(),
          stock: Number(variant.stock) || 0,
          mrp: price,
          basePrice: price,
          discount,
          limitedTimeOffer: discount > 0 ? Boolean(variant.limitedTimeOffer) : false,
          finalPrice,
        };
      });

      const hasLimitedTimeOffer = cleanVariants.some((variant) => variant.limitedTimeOffer);

      await onSubmit({
        title: name.trim(),
        name: name.trim(),
        description: description.trim() || "",
        category,
        subcategory,
        brand: brand.trim() || "",
        image: resolvedImageUrl,
        status: "draft",
        stock: totalStock > 0 ? `${totalStock} units` : null,
        stockCount: totalStock,
        variantCount: variants.length,
        variants: cleanVariants,
        price: cleanVariants[0]?.finalPrice ?? 0,
        originalPrice: cleanVariants[0]?.basePrice ?? 0,
        discount: cleanVariants[0]?.discount ? `${cleanVariants[0].discount}%` : undefined,
        limitedTimeOffer: hasLimitedTimeOffer,
        rating: 0,
        reviews: 0,
        gender,
      });

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
      <div className="dialog-card add-product-dialog" onClick={(event) => event.stopPropagation()}>
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
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g., Premium Leather Wallet" />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Product description..." />
          </label>

          <div className="dialog-grid-2">
            <label>
              Category *
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setSubcategory("");
                }}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Brand
              <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Brand name" />
            </label>
          </div>

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
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
              disabled={!subcategoryOptions.length}
            >
              <option value="">
                {category === "Clothing" && !gender ? "Select audience first" : "Select subcategory"}
              </option>
              {subcategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label>
            Cover Image URL
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/image.jpg" />
          </label>

          <label>
            Upload From Device
            <input type="file" accept="image/*" onChange={handleImageFileChange} />
          </label>

          {imageFile ? (
            <div className="dialog-upload-meta">
              <span>{imageFile.name}</span>
              <button type="button" className="danger-link" onClick={clearSelectedImageFile}>Remove file</button>
            </div>
          ) : null}

          {imageFile ? (
            <p className="dialog-helper-text">The selected file will be uploaded to Firebase Storage when you create the product.</p>
          ) : null}

          {imagePreviewUrl || imageUrl.trim() ? (
            <div className="dialog-image-preview">
              <img src={imagePreviewUrl || imageUrl.trim()} alt="Selected product preview" />
            </div>
          ) : null}

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
                <label>SKU<input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} placeholder="SKU..." /></label>
                <label>Color<input value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} placeholder="Color" /></label>
              </div>
              <div className="dialog-grid-2">
                <label>Size<input value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} placeholder="Size" /></label>
                <label>Stock<input value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} inputMode="numeric" placeholder="0" /></label>
              </div>
              <div className="dialog-grid-2">
                <label>Selling Price<input value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} inputMode="decimal" placeholder="0" /></label>
                <label>Discount (%)<input value={variant.discount} onChange={(event) => updateVariant(index, "discount", event.target.value)} inputMode="decimal" placeholder="0" /></label>
              </div>
              {parseNumber(variant.discount) > 0 ? (
                <label className="dialog-checkbox-row">
                  <input
                    type="checkbox"
                    checked={variant.limitedTimeOffer}
                    onChange={(event) => updateVariant(index, "limitedTimeOffer", event.target.checked)}
                  />
                  {" "}Limited Time Offer
                </label>
              ) : null}
              <div className="dialog-grid-2">
                <label>Final Price<input value={variant.finalPrice} onChange={(event) => updateVariant(index, "finalPrice", event.target.value)} inputMode="decimal" placeholder="0" /></label>
                <label>Total Stock<div className="readonly-value">{totalStock} units</div></label>
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
