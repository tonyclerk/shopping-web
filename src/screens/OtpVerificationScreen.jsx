import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function OtpVerificationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");

  const countryCode = location.state?.countryCode ?? "";
  const phoneNumber = location.state?.phoneNumber ?? "";

  const canVerify = otp.trim().length >= 4;

  const handleVerify = () => {
    if (!canVerify) return;
    navigate("/onboarding", {
      replace: true,
      state: {
        countryCode,
        phoneNumber,
        loginSuccess: true,
      },
    });
  };

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">OTP Verification</h1>
        <p className="subtitle">
          {phoneNumber ? `Code sent to ${countryCode} ${phoneNumber}` : "Enter your one-time password"}
        </p>

        <label className="label">OTP</label>
        <input
          className="field"
          type="text"
          inputMode="numeric"
          placeholder="Enter OTP"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
        />

        <button className="button" disabled={!canVerify} onClick={handleVerify}>
          Verify and Continue
        </button>
        <button className="button secondary-button" onClick={() => navigate("/login")}>
          Back to Login
        </button>

        <p className="helper">Next step: complete onboarding, categories, and KYC documents.</p>
      </section>
    </main>
  );
}

export default OtpVerificationScreen;
