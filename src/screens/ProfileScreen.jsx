import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase"; // 👈 adjust path
import SellerLayout from "../components/SellerLayout.jsx";
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
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(new Date()), []
  );

  // ── Fetch seller data from Firestore ───────────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (seller) => {
      if (!seller) { setLoading(false); return; }

      setSellerId(seller.uid);

      try {
        const docSnap = await getDoc(doc(db, "sellers", seller.uid));
        const d = docSnap.exists() ? docSnap.data() : {};

        const profileData = {
          vendorName:     d.name          ?? seller.displayName ?? "—",
          approvalStatus: d.status        ?? "pending",
          vendorId:       seller.uid,
          business: {
            brandName: d.name            ?? seller.displayName ?? "—",
            email:     d.email           ?? seller.email       ?? "—",
            phone:     d.phone           ?? "—",
            address:   d.address         ?? "—",
            createdOn: seller.metadata?.creationTime
              ? new Date(seller.metadata.creationTime).toLocaleDateString()
              : "—",
          },
          bank: {
            accountHolderName: d.bank?.accountHolderName ?? "—",
            accountNumber:     d.bank?.accountNumber     ?? "—",
            ifscCode:          d.bank?.ifscCode          ?? "—",
            bankName:          d.bank?.bankName          ?? "—",
          },
        };

        setProfile(profileData);
        setDraft(profileData);
      } catch (err) {
        console.error("Failed to fetch seller profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const handleTabChange = (tabKey) => {
    if (isEditing) return;
    setActiveTab(tabKey);
  };

  const startEdit = () => {
    if (activeTab === "categories") setActiveTab("business");
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  // ── Save to Firestore ──────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!sellerId) return;
    try {
      await updateDoc(doc(db, "sellers", sellerId), {
        name:    draft.business.brandName,
        email:   draft.business.email,
        phone:   draft.business.phone,
        address: draft.business.address,
        bank: {
          accountHolderName: draft.bank.accountHolderName,
          accountNumber:     draft.bank.accountNumber,
          ifscCode:          draft.bank.ifscCode,
          bankName:          draft.bank.bankName,
        },
      });
      setProfile(draft);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      window.alert("Failed to save changes. Please try again.");
    }
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

  if (loading) return (
    <SellerLayout selectedMenu="" title="Profile" subtitle={formattedDate} contentClassName="no-pad">
      <p style={{ padding: 24, textAlign: "center", color: "#6A7282" }}>Loading profile...</p>
    </SellerLayout>
  );

  if (!profile) return (
    <SellerLayout selectedMenu="" title="Profile" subtitle={formattedDate} contentClassName="no-pad">
      <p style={{ padding: 24, textAlign: "center", color: "#6A7282" }}>No profile data found.</p>
    </SellerLayout>
  );

  return (
    <SellerLayout selectedMenu="" title="Profile" subtitle={formattedDate} contentClassName="no-pad">
      <main className="profile-content">
        <section className="profile-head">
          <div>
            <h2>Profile</h2>
            <p>Manage your business information</p>
          </div>
          <div className="profile-head-actions">
            {isEditing && (
              <button type="button" className="profile-cancel-btn" onClick={cancelEdit}>Cancel</button>
            )}
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

        {activeTab === "business" && (
          <section className="profile-details-card">
            <h4>Business Details</h4>
            <div className="profile-grid">
              <Field label="Brand Name"  value={isEditing ? draft.business.brandName : profile.business.brandName} editing={isEditing} onChange={(v) => updateBusiness("brandName", v)} />
              <Field label="Email"       value={isEditing ? draft.business.email     : profile.business.email}     editing={isEditing} onChange={(v) => updateBusiness("email", v)} />
              <Field label="Phone"       value={isEditing ? draft.business.phone     : profile.business.phone}     editing={isEditing} onChange={(v) => updateBusiness("phone", v)} />
              <Field label="Address"     value={isEditing ? draft.business.address   : profile.business.address}   editing={isEditing} onChange={(v) => updateBusiness("address", v)} full />
            </div>
            <p className="profile-created">Account created on {profile.business.createdOn}</p>
          </section>
        )}

        {activeTab === "bank" && (
          <section className="profile-details-card">
            <h4>Banking Information</h4>
            <div className="profile-grid">
              <Field label="Account Holder Name" value={isEditing ? draft.bank.accountHolderName : profile.bank.accountHolderName} editing={isEditing} onChange={(v) => updateBank("accountHolderName", v)} />
              <Field label="Account Number"      value={isEditing ? draft.bank.accountNumber     : profile.bank.accountNumber}     editing={isEditing} onChange={(v) => updateBank("accountNumber", v)} />
              <Field label="IFSC Code"           value={isEditing ? draft.bank.ifscCode          : profile.bank.ifscCode}          editing={isEditing} onChange={(v) => updateBank("ifscCode", v)} />
              <Field label="Bank Name"           value={isEditing ? draft.bank.bankName          : profile.bank.bankName}          editing={isEditing} onChange={(v) => updateBank("bankName", v)} />
            </div>
            <p className="profile-note">
              Note: Your bank details are used for settlement payments. Ensure all information is accurate to avoid payment delays.
            </p>
          </section>
        )}

        {activeTab === "categories" && (
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
        )}
      </main>
    </SellerLayout>
  );
}

function Field({ label, value, editing, onChange, full = false }) {
  return (
    <div className={`profile-field ${full ? "full" : ""}`.trim()}>
      <label>{label}</label>
      {editing ? (
        <input type="text" className="profile-input-edit" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="profile-input-like">{value}</div>
      )}
    </div>
  );
}

export default ProfileScreen;