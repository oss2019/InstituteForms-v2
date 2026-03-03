import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import "../../Pages/Student Portal/StudentPortal.css";

const ISSUES = [
  "Overpriced Items",
  "Poor Food Quality",
  "Unhygienic Conditions",
  "Expired / Stale Products",
  "Limited Healthy Options",
  "Cash Only — No UPI",
  "Rude Staff",
  "Inadequate Seating",
  "Slow Service",
  "Inaccurate Billing",
  "No Nutritional Info",
  "Other",
];

const RATINGS = [
  { key: "foodQuality",    label: "Food / Product Quality" },
  { key: "priceFairness",  label: "Price Fairness" },
  { key: "hygieneRating",  label: "Hygiene & Cleanliness" },
  { key: "staffBehaviour", label: "Staff Behaviour" },
  { key: "overallRating",  label: "Overall Experience" },
];

const OUTLETS = [
  "Main Canteen",
  "Tea & Snack Stall",
  "Juice Corner",
  "Night Canteen",
  "Tuck Shop",
  "Other",
];

const StarRating = ({ name, value, onChange }) => (
  <div style={{ direction: "rtl", display: "inline-flex" }}>
    {[5, 4, 3, 2, 1].map((n) => (
      <label key={n} title={`${n} star${n > 1 ? "s" : ""}`} style={{ fontSize: "1.55rem", cursor: "pointer", color: n <= value ? "#f59e0b" : "#d1d5db", transition: "color .15s" }}>
        <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} style={{ display: "none" }} />
        ★
      </label>
    ))}
  </div>
);

const todayStr = () => new Date().toISOString().split("T")[0];

const CanteenFeedbackForm = () => {
  const user  = JSON.parse(localStorage.getItem("user-info") || "{}");
  const email = user.email || "";
  const name  = user.name  || email.split("@")[0] || "";

  const initState = {
    outletName: "Main Canteen",
    visitDate: todayStr(),
    itemsPurchased: "",
    foodQuality:    0,
    priceFairness:  0,
    hygieneRating:  0,
    staffBehaviour: 0,
    overallRating:  0,
    issues: [],
    suggestions: "",
    additionalComments: "",
  };

  const [form, setForm]       = useState(initState);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]     = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleIssue = (issue) =>
    set("issues", form.issues.includes(issue)
      ? form.issues.filter((i) => i !== issue)
      : [...form.issues, issue]);

  const validate = () => {
    if (!form.itemsPurchased.trim()) return "Please mention the items you purchased.";
    const required = ["foodQuality","priceFairness","hygieneRating","staffBehaviour","overallRating"];
    for (const r of required) {
      if (!form[r] || form[r] < 1) return `Please rate: ${RATINGS.find(x => x.key === r)?.label}`;
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/feedback/canteen", {
        ...form,
        studentEmail: email,
        studentName: name,
      });
      setSubmitted(true);
    } catch (ex) {
      setError(ex.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="sf-page">
        <div className="sf-success">
          <div className="sf-success__icon">✅</div>
          <h3>Feedback Submitted!</h3>
          <p>
            Thank you, {name}. Your canteen feedback has been recorded and will
            be reviewed by the <strong>Canteen Secretary</strong>.
          </p>
          <button className="sf-btn-submit" style={{ marginTop: ".5rem" }} onClick={() => { setForm(initState); setSubmitted(false); }}>
            Submit Another
          </button>
          <Link to="/student" style={{ fontSize: ".83rem", color: "#2a5298", marginTop: ".5rem" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-page">
      <div className="sf-header">
        <h2>☕ Canteen Feedback Form</h2>
        <p>
          Help improve canteen services at IIT Dharwad. Your feedback is
          reviewed by the <strong>Canteen Secretary</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Section 1: Visit Details ── */}
        <div className="sf-section-title">1. Visit Details</div>
        <div className="sf-row">
          <div className="sf-field">
            <label>Your Name</label>
            <input className="sf-input" value={name} readOnly />
          </div>
          <div className="sf-field">
            <label>Email</label>
            <input className="sf-input" value={email} readOnly />
          </div>
          <div className="sf-field">
            <label>Outlet / Stall <span className="req">*</span></label>
            <select className="sf-select" value={form.outletName} onChange={(e) => set("outletName", e.target.value)} required>
              {OUTLETS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="sf-field">
            <label>Visit Date <span className="req">*</span></label>
            <input type="date" className="sf-input" value={form.visitDate} max={todayStr()} onChange={(e) => set("visitDate", e.target.value)} required />
          </div>
        </div>

        <div className="sf-row">
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Items Purchased <span className="req">*</span></label>
            <input
              className="sf-input"
              placeholder="e.g. Samosa, Cutting Chai, Maggi..."
              value={form.itemsPurchased}
              onChange={(e) => set("itemsPurchased", e.target.value)}
              required
            />
          </div>
        </div>

        {/* ── Section 2: Ratings ── */}
        <div className="sf-section-title">2. Ratings  (1 = Poor · 5 = Excellent)</div>
        <div className="sf-ratings-grid">
          {RATINGS.map(({ key, label }) => (
            <div className="sf-rating-item" key={key}>
              <label>{label} <span className="req">*</span></label>
              <StarRating name={key} value={form[key]} onChange={(v) => set(key, v)} />
            </div>
          ))}
        </div>

        {/* ── Section 3: Issues ── */}
        <div className="sf-section-title">3. Issues Noticed  (select all that apply)</div>
        <div className="sf-checks-grid">
          {ISSUES.map((issue) => (
            <label key={issue} className="sf-check-item">
              <input type="checkbox" checked={form.issues.includes(issue)} onChange={() => toggleIssue(issue)} />
              {issue}
            </label>
          ))}
        </div>

        {/* ── Section 4: Open-ended ── */}
        <div className="sf-section-title">4. Your Suggestions &amp; Comments</div>
        <div className="sf-row">
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Suggestions for Improvement</label>
            <textarea
              className="sf-textarea"
              placeholder="e.g. Please introduce healthier snack options; accept UPI payments..."
              value={form.suggestions}
              onChange={(e) => set("suggestions", e.target.value)}
              rows={3}
            />
          </div>
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Additional Comments</label>
            <textarea
              className="sf-textarea"
              placeholder="Any other feedback, compliments or concerns..."
              value={form.additionalComments}
              onChange={(e) => set("additionalComments", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: "#e53e3e", fontSize: ".82rem", marginTop: ".5rem", background: "#fff5f5", padding: ".5rem .75rem", borderRadius: ".4rem", border: "1px solid #fed7d7" }}>
            ⚠️ {error}
          </p>
        )}

        <div className="sf-submit-row">
          <button type="button" className="sf-btn-reset" onClick={() => { setForm(initState); setError(""); }}>
            Reset Form
          </button>
          <button type="submit" className="sf-btn-submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CanteenFeedbackForm;
