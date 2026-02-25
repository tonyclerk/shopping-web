import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./RequestCategoriesScreen.css";

const CATEGORY_OPTIONS = [
  {
    id: "clothing",
    label: "Clothing",
    description: "Apparel for men, women, and children including formal and casual wear",
  },
  {
    id: "watches",
    label: "Watches",
    description: "Timepieces including smart watches, luxury watches, and casual watches",
  },
];

function RequestCategoriesScreen() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [reason, setReason] = useState("");

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => (prev.includes(categoryId) ? prev.filter((item) => item !== categoryId) : [...prev, categoryId]));
  };

  const canSubmit = selectedCategories.length > 0 && reason.trim().length >= 20;

  return (
    <SellerLayout selectedMenu="" title="Request-Categories" subtitle={formattedDate} contentClassName="no-pad">
      <main className="request-category-content">
        <button type="button" className="request-back-btn" onClick={() => navigate("/profile")}>
          ← Back to Profile
        </button>

        <section>
          <h2 className="request-title">Request New Categories</h2>
          <p className="request-subtitle">Expand your selling permissions by requesting access to new categories</p>
        </section>

        <section className="request-card">
          <h3>Currently Approved Categories</h3>
          <div className="request-approved-chip">Accessories</div>
        </section>

        <section className="request-card">
          <h3>Request Access to New Categories</h3>
          <p className="request-select-label">Select Categories</p>

          <div className="request-options-grid">
            {CATEGORY_OPTIONS.map((option) => {
              const checked = selectedCategories.includes(option.id);
              return (
                <button type="button" key={option.id} className={`request-option-card ${checked ? "selected" : ""}`} onClick={() => toggleCategory(option.id)}>
                  <div className="request-option-head">
                    <input type="checkbox" checked={checked} onChange={() => toggleCategory(option.id)} />
                    <strong>{option.label}</strong>
                  </div>
                  <p>{option.description}</p>
                </button>
              );
            })}
          </div>

          <label className="request-reason-label">
            Why do you want to sell in this category? <span>*</span>
          </label>
          <textarea
            className="request-reason-textarea"
            placeholder="Please explain your business case, experience in these categories, supplier partnerships, or any other relevant information..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <p className="request-reason-hint">Minimum 20 characters. Be specific about your plans and capabilities.</p>

          <div className="request-actions">
            <button type="button" className="request-submit-btn" disabled={!canSubmit}>
              Submit Request ({selectedCategories.length})
            </button>
          </div>
        </section>

        <section className="request-card">
          <h3>Request History</h3>
          <article className="request-history-item">
            <div className="request-history-head">
              <strong>Shoes</strong>
              <span>Pending</span>
            </div>
            <p className="history-meta">Requested on 1/16/2026</p>
            <p className="history-label">Reason:</p>
            <p className="history-copy">We have partnered with local shoe manufacturers and want to expand our product line.</p>
            <p className="history-warning">Your request is under review. We typically respond within 2-3 business days.</p>
          </article>
        </section>

        <section className="request-guidelines">
          <h3>Category Request Guidelines</h3>
          <ul>
            <li>Provide detailed information about your business case and experience</li>
            <li>Requests are typically reviewed within 2-3 business days</li>
            <li>Approval depends on your vendor rating, compliance history, and business plan</li>
            <li>You may be asked to provide additional documentation or samples</li>
            <li>Once approved, you can immediately start listing products in the new category</li>
          </ul>
        </section>
      </main>
    </SellerLayout>
  );
}

export default RequestCategoriesScreen;
