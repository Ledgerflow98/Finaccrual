import { useState } from "react";
import { Header } from "./ui";

const plans = [
  {
    name: "Basic",
    price: 699,
    icon: "✦",
    tone: "starter",
    features: ["1 company connection", "Master data sync", "Email support"],
  },
  {
    name: "Standard",
    price: 1299,
    icon: "◈",
    tone: "ent",
    features: [
      "3 company connections",
      "Scheduled refresh",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: 1999,
    icon: "♛",
    tone: "pro",
    featured: true,
    features: ["Up to 10 companies", "Automated schedules", "Premium support"],
  },
];

export function Plans({ user, onBack, onSelect }) {
  const [annual, setAnnual] = useState(false);
  return (
    <section className="view active">
      <Header title="Choose Your Plan" user={user} onBack={onBack} />
      <div className="view-content scrollable">
        <div className="plans-intro">
          <p className="plans-intro-text">
            Choose the plan that works best for your business.
          </p>
        </div>
        <div className="billing-toggle-row">
          <span
            className={!annual ? "billing-label active-label" : "billing-label"}
          >
            Monthly
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={annual}
              onChange={(event) => setAnnual(event.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
          <span
            className={annual ? "billing-label active-label" : "billing-label"}
          >
            Annual
          </span>
          {annual && <span className="save-chip">SAVE 20%</span>}
        </div>
        <div className="plan-cards">
          {plans.map((plan) => {
            const price = annual ? Math.round(plan.price * 9.6) : plan.price;
            return (
              <article
                key={plan.name}
                className={`plan-card ${plan.featured ? "plan-card-featured" : ""}`}
              >
                {plan.featured && (
                  <span className="plan-popular-badge">MOST POPULAR</span>
                )}
                <div className="plan-card-header">
                  <span className="plan-icon">{plan.icon}</span>
                  <span className={`plan-name ${plan.tone}-color`}>
                    {plan.name}
                  </span>
                </div>
                <div className="plan-price-row">
                  <span className="plan-currency">₹</span>
                  <span className="plan-amount">
                    {price.toLocaleString("en-IN")}
                  </span>
                  <span className="plan-period">
                    /{annual ? "year" : "month"}
                  </span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
                <button
                  className={`plan-btn plan-btn-${plan.tone === "starter" ? "starter" : plan.tone === "ent" ? "ent" : "pro"}`}
                  onClick={() =>
                    onSelect(plan, price, annual ? "annual" : "monthly")
                  }
                >
                  Choose {plan.name}
                </button>
              </article>
            );
          })}
        </div>
        <p className="plans-secure-note">Secure payment · Cancel anytime</p>
      </div>
    </section>
  );
}
