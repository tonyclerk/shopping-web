import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./OnboardingFlow.css";

function OnboardingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showToast, setShowToast] = useState(Boolean(location.state?.loginSuccess));
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    brandName: "",
    businessEmail: "",
    businessAddress: "",
    phone: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  useEffect(() => {
    if (!showToast) return;
    const timeout = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timeout);
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    const loadSellerProfile = async () => {
      const seller = auth.currentUser;
      if (!seller) return;

      try {
        const sellerSnapshot = await getDoc(doc(db, "sellers", seller.uid));
        const sellerData = sellerSnapshot.exists() ? sellerSnapshot.data() : {};

        if (!isMounted) return;

        setForm((prev) => ({
          ...prev,
          brandName: sellerData.businessName ?? prev.brandName,
          businessEmail: sellerData.email ?? seller.email ?? prev.businessEmail,
          businessAddress: sellerData.address ?? prev.businessAddress,
          phone: sellerData.phone ?? location.state?.phoneNumber ?? prev.phone,
          accountHolder: sellerData.bank?.accountHolderName ?? prev.accountHolder,
          accountNumber: sellerData.bank?.accountNumber ?? prev.accountNumber,
          ifscCode: sellerData.bank?.ifscCode ?? prev.ifscCode,
          bankName: sellerData.bank?.bankName ?? prev.bankName,
        }));
      } catch (error) {
        console.error("Failed to load onboarding details:", error);
      }
    };

    loadSellerProfile();

    return () => {
      isMounted = false;
    };
  }, [location.state?.phoneNumber]);

  const progress = useMemo(() => (1 / 3) * 100, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const canContinue = Boolean(
    form.brandName.trim() &&
    form.businessEmail.trim() &&
    form.businessAddress.trim()
  );

  const handleContinue = async () => {
    if (!canContinue || isSaving) return;

    const seller = auth.currentUser;
    if (!seller) {
      navigate("/auth/login", { replace: true });
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(doc(db, "sellers", seller.uid), {
        businessName: form.brandName.trim(),
        email: form.businessEmail.trim(),
        address: form.businessAddress.trim(),
        phone: form.phone.trim() || location.state?.phoneNumber || "",
        bank: {
          accountHolderName: form.accountHolder.trim(),
          accountNumber: form.accountNumber.trim(),
          ifscCode: form.ifscCode.trim(),
          bankName: form.bankName.trim(),
        },
        onboarding: {
          businessInfoCompleted: true,
        },
      }, { merge: true });

      navigate("/categories", { replace: true });
    } catch (error) {
      console.error("Failed to save onboarding details:", error);
      window.alert("Failed to save business information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flow-page">
      {showToast ? <div className="flow-toast">Login successful!</div> : null}

      <section className="flow-wrap">
        <header className="flow-header">
          <div className="flow-header-icon">
            <img src="/icons/store.svg" alt="" />
          </div>
          <div>
            <h1>Vendor Onboarding</h1>
            <p>Complete your profile to start selling</p>
          </div>
        </header>

        <div className="flow-progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="flow-steps">
          <span className="active">Business Info</span>
          <span>Categories</span>
          <span>KYC Documents</span>
        </div>

        <section className="flow-card">
          <div className="flow-card-head">
            <h2>Business Information</h2>
            <p>Tell us about your business</p>
          </div>

          <form className="flow-card-body" onSubmit={(event) => event.preventDefault()}>
            <label className="flow-field">
              Brand Name *
              <input value={form.brandName} onChange={(event) => update("brandName", event.target.value)} placeholder="Your brand name" />
            </label>

            <label className="flow-field">
              Business Email *
              <input
                value={form.businessEmail}
                onChange={(event) => update("businessEmail", event.target.value)}
                placeholder="contact@yourbrand.com"
                type="email"
              />
            </label>

            <label className="flow-field">
              Business Address *
              <textarea
                value={form.businessAddress}
                onChange={(event) => update("businessAddress", event.target.value)}
                placeholder="Complete business address"
                rows={3}
              />
            </label>

            <label className="flow-field">
              Phone Number
              <input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Business phone number" />
            </label>

            <div className="flow-divider">
              <h2>Bank Details</h2>
            </div>

            <label className="flow-field">
              Account Holder Name
              <input value={form.accountHolder} onChange={(event) => update("accountHolder", event.target.value)} placeholder="Account holder name" />
            </label>

            <label className="flow-field">
              Account Number
              <input value={form.accountNumber} onChange={(event) => update("accountNumber", event.target.value)} placeholder="Bank account number" />
            </label>

            <div className="flow-grid-2">
              <label className="flow-field">
                IFSC Code
                <input value={form.ifscCode} onChange={(event) => update("ifscCode", event.target.value)} placeholder="IFSC code" />
              </label>
              <label className="flow-field">
                Bank Name
                <input value={form.bankName} onChange={(event) => update("bankName", event.target.value)} placeholder="Bank name" />
              </label>
            </div>

            <button type="button" className="flow-submit" onClick={handleContinue} disabled={!canContinue || isSaving}>
              {isSaving ? "Saving..." : "Continue to Categories"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default OnboardingScreen;
