import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SellerLayout.css";

const MENU_ITEMS = [
  { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { icon: "products", label: "Products", path: "/products" },
  { icon: "inventory", label: "Inventory", path: "/inventory" },
  { icon: "orders", label: "Orders", path: "/orders" },
  { icon: "payments", label: "Payments", path: "/payments" },
  { icon: "returns", label: "Returns", path: "/returns-management" },
];

function SellerLayout({ selectedMenu, title, subtitle, children, contentClassName = "", onLogout }) {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleMenuSelect = (item) => {
    setMobileNavOpen(false);
    navigate(item.path);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    if (!window.confirm("Are you sure you want to logout?")) return;
    navigate("/login", { replace: true });
  };

  return (
    <div className="seller-shell">
      <button type="button" className="seller-mobile-menu" onClick={() => setMobileNavOpen((value) => !value)}>
        Menu
      </button>

      <aside className={`seller-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="seller-sidebar-header">
          <div className="seller-brand-icon">
            <img src="/icons/shopping_cart.svg" alt="Brand" />
          </div>
          <div>
            <p className="seller-brand-code">0000000</p>
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
              <div className="seller-profile-avatar">0</div>
              <div>
                <p className="seller-profile-name">0000000</p>
                <p className="seller-profile-id">00000000000000</p>
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
