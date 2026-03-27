import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import SellerLayout from "../components/SellerLayout.jsx";
import { buildProfileState, SELLER_CATEGORIES } from "../utils/sellerProfile";
import "./ProfileScreen.css";

const TABS = [
  { key: "business", label: "Business Information" },
  { key: "bank", label: "Bank Details" },
  { key: "categories", label: "Categories" },
];

function ProfileScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("business");
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState(null);

  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date()),
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (seller) => {
      if (!seller) {
        setLoading(false);
        return;
      }

      setSellerId(seller.uid);

      try {
        const sellerSnapshot = await getDoc(doc(db, "sellers", seller.uid));
        const sellerData = sellerSnapshot.exists() ? sellerSnapshot.data() : {};
        const profileData = buildProfileState(sellerData, seller);

        setProfile(profileData);
        setDraft(profileData);
      } catch (error) {
        console.error("Failed to fetch seller profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTabChange = (tabKey) => {
    if (isEditing) return;
    setActiveTab(tabKey);
  };

  const startEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!sellerId || !draft) return;

    try {
      await setDoc(doc(db, "sellers", sellerId), {
        businessName: draft.business.brandName,
        email: draft.business.email,
        phone: draft.business.phone,
        address: draft.business.address,
        categories: draft.categories,
        bank: {
          accountHolderName: draft.bank.accountHolderName,
          accountNumber: draft.bank.accountNumber,
          ifscCode: draft.bank.ifscCode,
          bankName: draft.bank.bankName,
        },
        onboarding: {
          businessInfoCompleted: true,
          categoriesCompleted: true,
        },
      }, { merge: true });

      setProfile(draft);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      window.alert("Failed to save changes. Please try again.");
    }
  };

  const updateBusiness = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      business: { ...prev.business, [field]: value },
    }));
  };

  const updateBank = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      bank: { ...prev.bank, [field]: value },
    }));
  };

  const toggleCategory = (categoryName) => {
    setDraft((prev) => {
      const exists = prev.categories.includes(categoryName);

      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((item) => item !== categoryName)
          : [...prev.categories, categoryName],
      };
    });
  };

  if (loading) {
    return (
      <SellerLayout selectedMenu="" title="Profile" subtitle={formattedDate} contentClassName="no-pad">
        <p style={{ padding: 24, textAlign: "center", color: "#6A7282" }}>Loading profile...</p>
      </SellerLayout>
    );
  }

  if (!profile || !draft) {
    return (
      <SellerLayout selectedMenu="" title="Profile" subtitle={formattedDate} contentClassName="no-pad">
        <p style={{ padding: 24, textAlign: "center", color: "#6A7282" }}>No profile data found.</p>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout selectedMenu="" title="Profile" subtitle={formattedDate} contentClassName="no-pad">
      <main className="profile-content">
        <section className="profile-head">
          <div>
            <h2>Profile</h2>
            <p>Manage your business information</p>
          </div>
          <div className="profile-head-actions">
            {isEditing ? (
              <button type="button" className="profile-cancel-btn" onClick={cancelEdit}>Cancel</button>
            ) : null}
            <button type="button" className="profile-edit-btn" onClick={isEditing ? saveEdit : startEdit}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-avatar">{profile.vendorName?.[0]?.toUpperCase() ?? "?"}</div>
          <div className="profile-card-copy">
            <div className="profile-name-row">
              <h3>{profile.vendorName}</h3>
              <span>{profile.approvalStatus}</span>
            </div>
            <p>Email: {profile.business.email}</p>
            <p>Phone: {profile.business.phone}</p>
            <p>Vendor ID: {profile.vendorId}</p>
          </div>
        </section>

        <section className="profile-tabs">
          {TABS.map((tab) => (
            <button type="button" key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => handleTabChange(tab.key)}>
              {tab.label}
            </button>
          ))}
        </section>

        {activeTab === "business" ? (
          <section className="profile-details-card">
            <h4>Business Details</h4>
            <div className="profile-grid">
              <Field label="Brand Name" value={isEditing ? draft.business.brandName : profile.business.brandName} editing={isEditing} onChange={(value) => updateBusiness("brandName", value)} />
              <Field label="Email" value={isEditing ? draft.business.email : profile.business.email} editing={isEditing} onChange={(value) => updateBusiness("email", value)} />
              <Field label="Phone" value={isEditing ? draft.business.phone : profile.business.phone} editing={isEditing} onChange={(value) => updateBusiness("phone", value)} />
              <Field label="Address" value={isEditing ? draft.business.address : profile.business.address} editing={isEditing} onChange={(value) => updateBusiness("address", value)} full />
            </div>
            <p className="profile-created">Account created on {profile.business.createdOn}</p>
          </section>
        ) : null}

        {activeTab === "bank" ? (
          <section className="profile-details-card">
            <h4>Banking Information</h4>
            <div className="profile-grid">
              <Field label="Account Holder Name" value={isEditing ? draft.bank.accountHolderName : profile.bank.accountHolderName} editing={isEditing} onChange={(value) => updateBank("accountHolderName", value)} />
              <Field label="Account Number" value={isEditing ? draft.bank.accountNumber : profile.bank.accountNumber} editing={isEditing} onChange={(value) => updateBank("accountNumber", value)} />
              <Field label="IFSC Code" value={isEditing ? draft.bank.ifscCode : profile.bank.ifscCode} editing={isEditing} onChange={(value) => updateBank("ifscCode", value)} />
              <Field label="Bank Name" value={isEditing ? draft.bank.bankName : profile.bank.bankName} editing={isEditing} onChange={(value) => updateBank("bankName", value)} />
            </div>
            <p className="profile-note">
              Note: Your bank details are used for settlement payments. Ensure all information is accurate to avoid payment delays.
            </p>
          </section>
        ) : null}

        {activeTab === "categories" ? (
          <section className="profile-details-card">
            <h4>Your Categories</h4>
            <p className="profile-categories-copy">
              {isEditing ? "Choose the categories you want to sell in." : "You are approved to sell in the following categories:"}
            </p>

            {isEditing ? (
              <div className="profile-grid">
                {SELLER_CATEGORIES.map((category) => (
                  <button
                    type="button"
                    key={category.name}
                    className={draft.categories.includes(category.name) ? "profile-category-chip active" : "profile-category-chip"}
                    onClick={() => toggleCategory(category.name)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : (
              draft.categories.length > 0 ? (
                <div className="profile-grid">
                  {draft.categories.map((category) => (
                    <div key={category} className="profile-category-chip active">{category}</div>
                  ))}
                </div>
              ) : (
                <p className="profile-note">No categories selected yet.</p>
              )
            )}

            <hr className="profile-section-divider" />
            <p className="profile-categories-copy">Want to sell in more categories? Contact support to expand your selling permissions.</p>
            <button type="button" className="profile-request-btn" onClick={() => navigate("/request-categories")}>
              Request New Category
            </button>
          </section>
        ) : null}
      </main>
    </SellerLayout>
  );
}

function Field({ label, value, editing, onChange, full = false }) {
  return (
    <div className={`profile-field ${full ? "full" : ""}`.trim()}>
      <label>{label}</label>
      {editing ? (
        <input type="text" className="profile-input-edit" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <div className="profile-input-like">{value}</div>
      )}
    </div>
  );
}

export default ProfileScreen;
