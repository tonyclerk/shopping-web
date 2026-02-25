import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SellerLayout from "../components/SellerLayout.jsx";
import "./ProfileScreen.css";

const TABS = [
  { key: "business", label: "Business Information" },
  { key: "bank", label: "Bank Details" },
  { key: "categories", label: "Categories" },
];

const INITIAL_PROFILE = {
  vendorName: "56945894",
  approvalStatus: "approved",
  vendorId: "vendor_1768734096617",
  business: {
    brandName: "56945894",
    email: "48145",
    phone: "+355629515691",
    address: "589158914",
    createdOn: "1/18/2026",
  },
  bank: {
    accountHolderName: "569456914",
    accountNumber: "14584841",
    ifscCode: "15691591",
    bankName: "56568914",
  },
};

function ProfileScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("business");
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [draft, setDraft] = useState(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleTabChange = (tabKey) => {
    if (isEditing) return;
    setActiveTab(tabKey);
  };

  const startEdit = () => {
    if (activeTab === "categories") {
      setActiveTab("business");
    }
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const saveEdit = () => {
    setProfile(draft);
    setIsEditing(false);
  };

  const updateBusiness = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      business: { ...prev.business, [field]: value },
      vendorName: field === "brandName" ? value : prev.vendorName,
    }));
  };

  const updateBank = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      bank: { ...prev.bank, [field]: value },
    }));
  };

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
              <button type="button" className="profile-cancel-btn" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
            <button type="button" className="profile-edit-btn" onClick={isEditing ? saveEdit : startEdit}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-avatar">5</div>
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
              <Field
                label="Brand Name"
                value={isEditing ? draft.business.brandName : profile.business.brandName}
                editing={isEditing}
                onChange={(value) => updateBusiness("brandName", value)}
              />
              <Field
                label="Email"
                value={isEditing ? draft.business.email : profile.business.email}
                editing={isEditing}
                onChange={(value) => updateBusiness("email", value)}
              />
              <Field
                label="Phone"
                value={isEditing ? draft.business.phone : profile.business.phone}
                editing={isEditing}
                onChange={(value) => updateBusiness("phone", value)}
              />
              <Field
                label="Address"
                value={isEditing ? draft.business.address : profile.business.address}
                editing={isEditing}
                onChange={(value) => updateBusiness("address", value)}
                full
              />
            </div>
            <p className="profile-created">Account created on {profile.business.createdOn}</p>
          </section>
        ) : null}

        {activeTab === "bank" ? (
          <section className="profile-details-card">
            <h4>Banking Information</h4>
            <div className="profile-grid">
              <Field
                label="Account Holder Name"
                value={isEditing ? draft.bank.accountHolderName : profile.bank.accountHolderName}
                editing={isEditing}
                onChange={(value) => updateBank("accountHolderName", value)}
              />
              <Field
                label="Account Number"
                value={isEditing ? draft.bank.accountNumber : profile.bank.accountNumber}
                editing={isEditing}
                onChange={(value) => updateBank("accountNumber", value)}
              />
              <Field
                label="IFSC Code"
                value={isEditing ? draft.bank.ifscCode : profile.bank.ifscCode}
                editing={isEditing}
                onChange={(value) => updateBank("ifscCode", value)}
              />
              <Field
                label="Bank Name"
                value={isEditing ? draft.bank.bankName : profile.bank.bankName}
                editing={isEditing}
                onChange={(value) => updateBank("bankName", value)}
              />
            </div>
            <p className="profile-note">
              Note: Your bank details are used for settlement payments. Ensure all information is accurate to avoid payment delays.
            </p>
          </section>
        ) : null}

        {activeTab === "categories" ? (
          <section className="profile-details-card">
            <h4>Your Categories</h4>
            <p className="profile-categories-copy">You are approved to sell in the following categories:</p>
            <div className="profile-category-chip">Accessories</div>
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
