import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebase";

const STATUS_ALIASES = {
  new: "pending",
  confirmed: "accepted",
  packed: "placed",
  picked_up: "placed",
};

const hasTimestampValue = (value) => {
  if (!value) return false;
  if (typeof value?.toDate === "function") return true;
  if (value instanceof Date) return true;
  return typeof value === "string" || typeof value === "number";
};

const normalizeOrderStatus = (order) => {
  const rawStatus = STATUS_ALIASES[order?.status] ?? order?.status ?? "pending";
  if (rawStatus === "placed" && !hasTimestampValue(order?.updatedAt)) return "pending";
  return rawStatus;
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function useSellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeOrders = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (seller) => {
      unsubscribeOrders();

      if (!seller) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const ordersQuery = query(collectionGroup(db, "orders"), orderBy("createdAt", "desc"));

      unsubscribeOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const sellerOrders = snapshot.docs
            .map((snap) => ({
              id: snap.id,
              ref: snap.ref,
              ...snap.data(),
            }))
            .filter((order) => order.items?.some((item) => item.sellerId === seller.uid))
            .map((order) => {
              const sellerItems = order.items.filter((item) => item.sellerId === seller.uid);
              return {
                ...order,
                status: normalizeOrderStatus(order),
                createdAtDate: toDate(order.createdAt),
                quantitySold: sellerItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
                finalPaidAmount: sellerItems.reduce(
                  (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
                  0,
                ),
              };
            });

          setOrders(sellerOrders);
          setLoading(false);
        },
        (error) => {
          console.error("Orders listener failed:", error);
          setOrders([]);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
    };
  }, []);

  return { orders, loading };
}
