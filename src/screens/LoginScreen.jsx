import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const COUNTRY_CODES = ["+355", "+1", "+44", "+91"];

function LoginScreen() {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("+355");
  const [phoneNumber, setPhoneNumber] = useState("");

  const canSendOtp = useMemo(() => phoneNumber.trim().length > 0, [phoneNumber]);

  const handleSendOtp = () => {
    if (!canSendOtp) return;
    navigate("/verify-otp", {
      state: {
        countryCode,
        phoneNumber: phoneNumber.trim(),
      },
    });
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">Vendor Portal</h1>
        <p className="subtitle">Sign in to manage your store</p>

        <label className="label">Phone Number</label>
        <div className="field-row">
          <select
            className="select"
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            style={{ maxWidth: 110 }}
          >
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <input
            className="field"
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
        </div>

        <button className="button" disabled={!canSendOtp} onClick={handleSendOtp}>
          Send OTP
        </button>
        <button className="button secondary-button" onClick={() => alert("Google login coming soon")}>
          Continue with Google
        </button>

        <p className="helper">Demo mode: use any phone number.</p>
      </section>
    </main>
  );
}

export default LoginScreen;
