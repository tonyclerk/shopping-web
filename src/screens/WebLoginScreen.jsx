import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { getSellerNextRoute } from "../utils/sellerProfile";

function WebLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canContinue = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password]);

  const login = async () => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      const user = userCredential.user;
      const sellerRef = doc(db, "sellers", user.uid);
      const sellerDoc = await getDoc(sellerRef);
      let sellerData = sellerDoc.exists() ? sellerDoc.data() : null;

      if (!sellerData) {
        const fallbackQuery = query(
          collection(db, "sellers"),
          where("email", "==", user.email ?? normalizedEmail),
          limit(1),
        );
        const fallbackResult = await getDocs(fallbackQuery);
        sellerData = fallbackResult.empty ? null : fallbackResult.docs[0].data();
      }

      if (!sellerData) {
        await signOut(auth);
        alert("Seller profile not found for this account. Please contact support.");
        return;
      }

      navigate(getSellerNextRoute(sellerData), { replace: true });
    } catch (err) {
      console.log(err);
      alert(err?.message ?? "Login failed");
    }
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Login</h1>
        <p className="subtitle">Sign in to access your seller dashboard.</p>

        <label className="label">Email</label>
        <input
          className="field"
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className="label">Password</label>
        <input
          className="field"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="button" disabled={!canContinue} onClick={login}>
          Continue
        </button>
        <button className="button secondary-button" onClick={() => navigate("/auth/signup")}>
          Don't have an account? Sign up
        </button>
      </section>
    </main>
  );
}

export default WebLoginScreen;
