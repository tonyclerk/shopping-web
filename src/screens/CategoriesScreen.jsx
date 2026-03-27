import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { SELLER_CATEGORIES } from "../utils/sellerProfile";
import "./OnboardingFlow.css";

const INITIAL_CATEGORIES = SELLER_CATEGORIES.map((category) => ({ ...category, isSelected: false }));

function CategoriesScreen() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const progress = useMemo(() => (2 / 3) * 100, []);

  useEffect(() => {
    let isMounted = true;

    const loadSellerCategories = async () => {
      const seller = auth.currentUser;
      if (!seller) return;

      try {
        const sellerSnapshot = await getDoc(doc(db, "sellers", seller.uid));
        const savedCategories = sellerSnapshot.exists() && Array.isArray(sellerSnapshot.data().categories)
          ? sellerSnapshot.data().categories
          : [];

        if (!isMounted || savedCategories.length === 0) return;

        setCategories(
          INITIAL_CATEGORIES.map((category) => ({
            ...category,
            isSelected: savedCategories.includes(category.name),
          }))
        );
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadSellerCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleCategory = (index) => {
    setCategories((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, isSelected: !item.isSelected } : item)));
  };

  const continueToKyc = async () => {
    const selectedCategories = categories.filter((item) => item.isSelected).map((item) => item.name);
    if (selectedCategories.length === 0 || isSaving) return;

    const seller = auth.currentUser;
    if (!seller) {
      navigate("/auth/login", { replace: true });
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(doc(db, "sellers", seller.uid), {
        categories: selectedCategories,
        onboarding: {
          businessInfoCompleted: true,
          categoriesCompleted: true,
          completedAt: new Date().toISOString(),
        },
      }, { merge: true });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setTimeout(() => navigate("/kyc-documents", { replace: true }), 500);
    } catch (error) {
      console.error("Failed to save categories:", error);
      window.alert("Failed to save categories. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flow-page">
      {showToast ? <div className="flow-toast">Categories selected!</div> : null}

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
          <span className="active">Categories</span>
          <span>KYC Documents</span>
        </div>

        <section className="flow-card">
          <div className="flow-card-head">
            <h2>Select Categories</h2>
            <p>Choose the product categories you&apos;ll sell</p>
          </div>

          <div className="flow-card-body">
            {categories.map((category, index) => (
              <article
                key={category.name}
                className={`flow-item ${category.isSelected ? "selected" : ""}`}
                onClick={() => toggleCategory(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCategory(index);
                  }
                }}
              >
                <span className="flow-check">{category.isSelected ? "✓" : ""}</span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
              </article>
            ))}

            <button
              type="button"
              className="flow-submit"
              onClick={continueToKyc}
              disabled={!categories.some((item) => item.isSelected) || isSaving}
            >
              {isSaving ? "Saving..." : "Continue to KYC"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default CategoriesScreen;
