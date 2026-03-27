import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getSellerNextRoute } from "../utils/sellerProfile";

function WebLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canContinue = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password]);

  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const sellerDoc = await getDoc(doc(db, "sellers", user.uid));

      if (!sellerDoc.exists()) {
        await signOut(auth);
        alert("Not a seller account");
        return;
      }

      navigate(getSellerNextRoute(sellerDoc.data()), { replace: true });
    } catch (err) {
      console.log(err);
      alert("Login failed");
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
