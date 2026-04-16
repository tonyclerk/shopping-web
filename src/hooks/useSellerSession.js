import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

function useSellerSession() {
  const [session, setSession] = useState({
    loading: true,
    user: null,
    seller: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSession({ loading: false, user: null, seller: null });
        return;
      }

      try {
        const sellerSnapshot = await getDoc(doc(db, "sellers", user.uid));
        let sellerData = sellerSnapshot.exists() ? sellerSnapshot.data() : null;

        if (!sellerData && user.email) {
          const byEmailQuery = query(
            collection(db, "sellers"),
            where("email", "==", user.email),
            limit(1),
          );
          const byEmailSnapshot = await getDocs(byEmailQuery);
          sellerData = byEmailSnapshot.empty ? null : byEmailSnapshot.docs[0].data();
        }

        setSession({
          loading: false,
          user,
          seller: sellerData,
        });
      } catch (error) {
        console.error("Failed to load seller session:", error);
        setSession({
          loading: false,
          user,
          seller: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return session;
}

export default useSellerSession;
