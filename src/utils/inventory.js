import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

export const DEFAULT_STOCK_THRESHOLD = 5;

export function parseStockCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/-?\d+/);
    return match ? Number(match[0]) : 0;
  }
  return 0;
}

function getVariantSummary(variants) {
  if (!Array.isArray(variants) || !variants.length) return "";

  const primary = variants[0] ?? {};
  const parts = [];
  if (primary.color) parts.push(`Color: ${primary.color}`);
  if (primary.size) parts.push(`Size: ${primary.size}`);

  if (parts.length) return parts.join(", ");
  if (variants.length > 1) return `${variants.length} variants`;
  return "Default variant";
}

function getProductSku(data, variants, productId) {
  return variants[0]?.sku ?? data.sku ?? productId;
}

export function getProductStockCount(data) {
  if (typeof data.stockCount === "number") return data.stockCount;
  if (Array.isArray(data.variants) && data.variants.length) {
    return data.variants.reduce((sum, variant) => sum + parseStockCount(variant.stock), 0);
  }
  return parseStockCount(data.stock);
}

export function normalizeInventoryProduct(docSnap) {
  const data = docSnap.data();
  const variants = Array.isArray(data.variants) ? data.variants : [];
  const stockCount = getProductStockCount(data);
  const threshold = typeof data.minThreshold === "number" ? data.minThreshold : DEFAULT_STOCK_THRESHOLD;
  const sellingPrice =
    data.price ??
    variants[0]?.finalPrice ??
    variants[0]?.basePrice ??
    variants[0]?.mrp ??
    0;

  return {
    id: docSnap.id,
    name: data.title ?? data.name ?? "Untitled Product",
    brand: data.brand ?? "",
    category: data.category ?? "",
    imageUrl: data.image ?? "",
    sku: getProductSku(data, variants, docSnap.id),
    variant: getVariantSummary(variants),
    stock: stockCount,
    threshold,
    status: stockCount < threshold ? "Low Stock" : "In Stock",
    minThreshold: threshold,
    sellingPrice,
    variants,
    raw: data,
  };
}

export function buildStockUpdatePayload(product, nextStock, threshold = DEFAULT_STOCK_THRESHOLD) {
  const currentVariants = Array.isArray(product.raw?.variants) ? product.raw.variants : [];
  const currentStocks = currentVariants.map((variant) => parseStockCount(variant.stock));

  const nextVariants = currentVariants.length
    ? currentVariants.map((variant, index) => {
        if (index === 0) return { ...variant, stock: 0 };
        return { ...variant, stock: parseStockCount(variant.stock) };
      })
    : [];

  if (nextVariants.length) {
    let remaining = nextStock;

    for (let index = 1; index < nextVariants.length; index += 1) {
      const preservedStock = Math.min(currentStocks[index], remaining);
      nextVariants[index] = { ...nextVariants[index], stock: preservedStock };
      remaining -= preservedStock;
    }

    const firstStock = Math.max(remaining, 0);
    nextVariants[0] = { ...nextVariants[0], stock: firstStock };
  }

  return {
    stockCount: nextStock,
    stock: `${nextStock} units`,
    minThreshold: threshold,
    variants: nextVariants.length ? nextVariants : currentVariants,
  };
}

export function useSellerInventoryProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProducts = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (seller) => {
      if (unsubscribeProducts) {
        unsubscribeProducts();
        unsubscribeProducts = null;
      }

      if (!seller) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const productsQuery = query(collection(db, "products"), where("sellerId", "==", seller.uid));

      unsubscribeProducts = onSnapshot(
        productsQuery,
        (snapshot) => {
          const rows = snapshot.docs.map(normalizeInventoryProduct);
          rows.sort((a, b) => {
            const aMs = a.raw?.createdAt?.toMillis?.() ?? 0;
            const bMs = b.raw?.createdAt?.toMillis?.() ?? 0;
            return bMs - aMs;
          });
          setProducts(rows);
          setLoading(false);
        },
        (error) => {
          console.error("Inventory listener failed:", error);
          setProducts([]);
          setLoading(false);
        },
      );
    });

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      unsubscribeAuth();
    };
  }, []);

  return { products, loading };
}
