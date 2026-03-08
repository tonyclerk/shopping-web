import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function SignupScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canContinue = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      confirmPassword.trim().length > 0 &&
      password === confirmPassword
    );
  }, [name, email, password, confirmPassword]);

  const signup = async () => {
    try {

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // store seller profile
      await setDoc(doc(db, "sellers", user.uid), {
        name: name,
        email: email,
        role: "seller",
        createdAt: new Date()
      });

      alert("Seller account created");

      navigate("/login");

    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Create Account</h1>
        <p className="subtitle">Register first, then continue to phone verification.</p>

        <label className="label">Full Name</label>
        <input
          className="field"
          type="text"
          placeholder="Enter full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

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

        <label className="label">Confirm Password</label>
        <input
          className="field"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <button className="button" disabled={!canContinue} onClick={signup}>
          Register
        </button>
        <button className="button secondary-button" onClick={() => navigate("/auth/login")}>
          Already have an account? Login
        </button>
      </section>
    </main>
  );
}

export default SignupScreen;
