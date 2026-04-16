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

const getOrderCreatedAtMs = (order) => {
  const createdAt = order?.createdAt;
  if (typeof createdAt?.toMillis === "function") return createdAt.toMillis();
  const parsed = new Date(createdAt ?? 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const matchesSeller = (item, seller) => {
  if (!item || !seller) return false;
  const sellerEmail = String(seller.email ?? "").trim().toLowerCase();
  const itemSellerEmail = String(item.sellerEmail ?? "").trim().toLowerCase();
  if (item.sellerId && item.sellerId === seller.uid) return true;
  if (sellerEmail && itemSellerEmail && itemSellerEmail === sellerEmail) return true;
  return false;
};

const matchesOrderSeller = (order, seller) => {
  if (!order || !seller) return false;
  const sellerEmail = String(seller.email ?? "").trim().toLowerCase();
  const orderSellerEmail = String(order.sellerEmail ?? "").trim().toLowerCase();

  if (order.sellerId && order.sellerId === seller.uid) return true;
  if (sellerEmail && orderSellerEmail && orderSellerEmail === sellerEmail) return true;
  if (Array.isArray(order.sellerIds) && order.sellerIds.includes(seller.uid)) return true;
  if (sellerEmail && Array.isArray(order.sellerEmails) && order.sellerEmails.map((v) => String(v).trim().toLowerCase()).includes(sellerEmail)) {
    return true;
  }
  return order.items?.some((item) => matchesSeller(item, seller)) ?? false;
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
      const subscribeToOrders = (preferOrderedQuery = true) => {
        const ordersQuery = preferOrderedQuery
          ? query(collectionGroup(db, "orders"), orderBy("createdAt", "desc"))
          : query(collectionGroup(db, "orders"));

        unsubscribeOrders = onSnapshot(
          ordersQuery,
        (snapshot) => {
          const sellerOrders = snapshot.docs
            .map((snap) => ({
              id: snap.id,
              ref: snap.ref,
              ...snap.data(),
            }))
            .filter((order) => matchesOrderSeller(order, seller))
            .map((order) => {
              const rawItems = Array.isArray(order.items) ? order.items : [];
              const sellerItems = rawItems.filter((item) => matchesSeller(item, seller));
              const finalItems = sellerItems.length ? sellerItems : rawItems;
              return {
                ...order,
                status: normalizeOrderStatus(order),
                createdAtDate: toDate(order.createdAt),
                quantitySold: finalItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
                finalPaidAmount: finalItems.reduce(
                  (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
                  0,
                ),
              };
            })
            .sort((a, b) => getOrderCreatedAtMs(b) - getOrderCreatedAtMs(a));

          setOrders(sellerOrders);
          setLoading(false);
        },
        (error) => {
          if (preferOrderedQuery && (error?.code === "failed-precondition" || error?.code === "permission-denied")) {
            console.warn("Falling back to un-ordered orders query:", error);
            subscribeToOrders(false);
            return;
          }
          console.error("Orders listener failed:", error);
          setOrders([]);
          setLoading(false);
        },
      );
      };

      subscribeToOrders(true);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
    };
  }, []);

  return { orders, loading };
}
