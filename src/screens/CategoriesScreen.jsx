import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OnboardingFlow.css";

const INITIAL_CATEGORIES = [
  { name: "Accessories", description: "Belts, bags, sunglasses, wallets", isSelected: false },
  { name: "Clothing", description: "Men, women, and kids clothing", isSelected: false },
  { name: "Shoes", description: "Casual, sports, and formal footwear", isSelected: false },
  { name: "Watches", description: "Analog, digital, and smart watches", isSelected: false },
];

function CategoriesScreen() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [showToast, setShowToast] = useState(false);
  const progress = useMemo(() => (2 / 3) * 100, []);

  const toggleCategory = (index) => {
    setCategories((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, isSelected: !item.isSelected } : item)));
  };

  const continueToKyc = () => {
    if (categories.some((item) => item.isSelected)) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    setTimeout(() => navigate("/kyc-documents", { replace: true }), 500);
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

            <button type="button" className="flow-submit" onClick={continueToKyc}>
              Continue to KYC
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default CategoriesScreen;
