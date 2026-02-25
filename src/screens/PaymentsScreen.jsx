import { useMemo } from "react";
import SellerLayout from "../components/SellerLayout.jsx";
import "./PaymentsScreen.css";

const SETTLEMENTS = [
  { period: "Jan 13 - Jan 19", orders: 156, revenue: 28650.0, penalties: 150.0, netAmount: 24202.5, status: "completed", date: "2026-01-20" },
  { period: "Jan 6 - Jan 12", orders: 142, revenue: 26890.0, penalties: 75.0, netAmount: 22781.5, status: "completed", date: "2026-01-13" },
  { period: "Dec 30 - Jan 5", orders: 168, revenue: 31250.0, penalties: 225.0, netAmount: 26337.5, status: "completed", date: "2026-01-06" },
  { period: "Dec 23 - Dec 29", orders: 134, revenue: 25420.0, penalties: 0.0, netAmount: 21607.0, status: "completed", date: "2025-12-30" },
  { period: "Dec 16 - Dec 22", orders: 159, revenue: 29830.0, penalties: 100.0, netAmount: 25255.5, status: "completed", date: "2025-12-23" },
];

const currency = (value) => `$${value.toFixed(2)}`;

function PaymentsScreen() {
  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()),
    [],
  );

  return (
    <SellerLayout selectedMenu="Payments" title="Payments & Settlements" subtitle={formattedDate} contentClassName="no-pad">
      <main className="payments-content">
        <section className="payments-summary-grid">
          <SummaryCard title="Total Earnings" value="$86,412" subtitle="Lifetime revenue" accent="#4F46E5" />
          <SummaryCard title="Pending Payouts" value="$74,372" subtitle="Awaiting settlement" accent="#F59E0B" />
          <SummaryCard title="Next Settlement" value="Jan 18, 2026" subtitle="In 1 day" accent="#10B981" />
        </section>

        <section className="payments-table-card">
          <div className="payments-table-head">
            <h2>Settlement History</h2>
            <button type="button" className="download-btn">Download Report</button>
          </div>

          <div className="payments-table-wrap">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Commission (15%)</th>
                  <th>Gateway (2%)</th>
                  <th>Penalties</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {SETTLEMENTS.map((settlement) => {
                  const commission = settlement.revenue * 0.15;
                  const gateway = settlement.revenue * 0.02;

                  return (
                    <tr key={`${settlement.period}-${settlement.date}`}>
                      <td>{settlement.period}</td>
                      <td>{settlement.orders}</td>
                      <td>{currency(settlement.revenue)}</td>
                      <td>{currency(commission)}</td>
                      <td>{currency(gateway)}</td>
                      <td>{currency(settlement.penalties)}</td>
                      <td className="net-amount">{currency(settlement.netAmount)}</td>
                      <td><span className="status-badge completed">Completed</span></td>
                      <td>
                        <button type="button" className="icon-action" onClick={() => window.alert(`Viewing settlement ${settlement.period}`)}>View</button>
                        <button type="button" className="icon-action" onClick={() => window.alert(`Downloading ${settlement.period}`)}>Download</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="payments-info-grid">
          <article className="info-card">
            <h3>Commission Structure</h3>
            <InfoRow label="Category Commission" value="15%" />
            <InfoRow label="Payment Gateway Fee" value="2%" />
            <hr />
            <InfoRow label="Total Deduction" value="17%" strong />
            <p className="muted-note">Your net earnings = Order value - (15% category commission + 2% gateway fee + SLA penalties)</p>
          </article>

          <article className="info-card">
            <h3>Settlement Schedule</h3>
            <ScheduleRow label="Frequency" value="Weekly" />
            <ScheduleRow label="Settlement Day" value="Every Monday" />
            <ScheduleRow label="Processing Time" value="2-3 business days" />
            <div className="schedule-banner">Next settlement on Jan 18, 2026</div>
          </article>
        </section>

        <section className="penalty-notice">
          <h4>SLA Penalty Information</h4>
          <p>Penalties are applied for late order processing, cancellations, and SLA violations. Maintain good performance to avoid deductions from your settlements.</p>
        </section>
      </main>
    </SellerLayout>
  );
}

function SummaryCard({ title, value, subtitle, accent }) {
  return (
    <article className="summary-card">
      <p>{title}</p>
      <h3 style={{ color: accent }}>{value}</h3>
      <span>{subtitle}</span>
    </article>
  );
}

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong className={strong ? "highlight" : ""}>{value}</strong>
    </div>
  );
}

function ScheduleRow({ label, value }) {
  return (
    <div className="schedule-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default PaymentsScreen;
