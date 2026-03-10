import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase"; // 👈 adjust path
import "./SellerLayout.css";

const MENU_ITEMS = [
  { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { icon: "products",  label: "Products",  path: "/products" },
  { icon: "inventory", label: "Inventory", path: "/inventory" },
  { icon: "orders",    label: "Orders",    path: "/orders" },
  { icon: "payments",  label: "Payments",  path: "/payments" },
  { icon: "returns",   label: "Returns",   path: "/returns-management" },
];

function SellerLayout({ selectedMenu, title, subtitle, children, contentClassName = "", onLogout }) {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sellerName,  setSellerName]  = useState("");
  const [sellerEmail, setSellerEmail] = useState("");

  // ── Fetch seller name + email ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (seller) => {
      if (!seller) return;

      // Always set email from Auth immediately
      setSellerEmail(seller.email ?? "");

      try {
        const snap = await getDoc(doc(db, "sellers", seller.uid));
        if (snap.exists()) {
          setSellerName(snap.data().name ?? seller.displayName ?? seller.email ?? "");
        } else {
          setSellerName(seller.displayName ?? seller.email ?? "");
        }
      } catch {
        setSellerName(seller.displayName ?? seller.email ?? "");
      }
    });

    return () => unsub();
  }, []);

  const handleMenuSelect = (item) => {
    setMobileNavOpen(false);
    navigate(item.path);
  };

  const handleLogout = () => {
    if (onLogout) { onLogout(); return; }
    if (!window.confirm("Are you sure you want to logout?")) return;
    navigate("/login", { replace: true });
  };

  return (
    <div className="seller-shell">
      <button type="button" className="seller-mobile-menu" onClick={() => setMobileNavOpen((v) => !v)}>
        Menu
      </button>

      <aside className={`seller-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="seller-sidebar-header">
          <div className="seller-brand-icon">
            <img src="/icons/shopping_cart.svg" alt="Brand" />
          </div>
          <div>
            <p className="seller-brand-code">{sellerName || "—"}</p>  {/* 👈 was hardcoded 0000000 */}
            <p className="seller-brand-name">Seller Portal</p>
          </div>
        </div>

        <nav className="seller-nav">
          {MENU_ITEMS.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`seller-nav-item ${selectedMenu === item.label ? "selected" : ""}`}
              onClick={() => handleMenuSelect(item)}
            >
              <img src={`/icons/${item.icon}.svg`} alt="" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="seller-sidebar-footer">
          <button type="button" className="seller-profile-btn" onClick={() => navigate("/profile")}>
            <div className="seller-profile-row">
              <div className="seller-profile-avatar">
                {sellerName?.[0]?.toUpperCase() ?? "?"}  {/* 👈 first letter of name */}
              </div>
              <div>
                <p className="seller-profile-name">{sellerName  || "—"}</p>   {/* 👈 was 0000000 */}
                <p className="seller-profile-id">{sellerEmail || "—"}</p>     {/* 👈 was 00000000000000 */}
              </div>
            </div>
          </button>
          <button type="button" className="seller-logout-btn" onClick={handleLogout}>
            <img src="/icons/logout.svg" alt="" />
            Logout
          </button>
        </div>
      </aside>

      <section className="seller-main">
        <header className="seller-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="seller-notification-btn" aria-label="Notifications" onClick={() => navigate("/notifications")}>
            <img src="/icons/bell.svg" alt="" />
          </button>
        </header>

        <main className={`seller-content ${contentClassName}`.trim()}>{children}</main>
      </section>
    </div>
  );
}

export default SellerLayout;