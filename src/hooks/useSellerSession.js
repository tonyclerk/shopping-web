import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

        setSession({
          loading: false,
          user,
          seller: sellerSnapshot.exists() ? sellerSnapshot.data() : null,
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
