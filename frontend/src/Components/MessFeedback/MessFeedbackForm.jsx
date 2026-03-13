import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import "../../Pages/Student Portal/StudentPortal.css";

const ISSUES = [
  "Cold / Lukewarm Food",
  "Undercooked Items",
  "Overcooked / Burnt Food",
  "Insufficient Quantity",
  "Lack of Variety",
  "Repetitive Menu",
  "Poor Hygiene in Serving Area",
  "Unclean Utensils",
  "Long Queue / Slow Service",
  "Rude Staff Behaviour",
  "Tasteless / Bland Food",
  "High Salt / Spice",
  "Stale Food",
  "Foreign Objects in Food",
  "Other",
];

const RATINGS = [
  { key: "overallRating",  label: "Overall Experience" },
  { key: "foodQuality",    label: "Food Quality & Taste" },
  { key: "hygiene",        label: "Hygiene & Cleanliness" },
  { key: "serviceSpeed",   label: "Service Speed" },
  { key: "portionSize",    label: "Portion / Quantity" },
  { key: "valueForMoney",  label: "Value for Money" },
];

const StarRating = ({ name, value, onChange }) => (
  <div className="sf-stars" style={{ direction: "rtl", display: "inline-flex" }}>
    {[5, 4, 3, 2, 1].map((n) => (
      <label key={n} title={`${n} star${n > 1 ? "s" : ""}`} style={{ fontSize: "1.55rem", cursor: "pointer", color: n <= value ? "#f59e0b" : "#d1d5db", transition: "color .15s" }}>
        <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} style={{ display: "none" }} />
        ★
      </label>
    ))}
  </div>
);

const todayStr = () => new Date().toISOString().split("T")[0];

const MessFeedbackForm = () => {
  const user  = JSON.parse(localStorage.getItem("user-info") || "{}");
  const email = user.email || "";
  const name  = user.name  || email.split("@")[0] || "";

  const initState = {
    title: "",
    mealType: "Lunch",
    date: todayStr(),
    overallRating:  0,
    foodQuality:    0,
    hygiene:        0,
    serviceSpeed:   0,
    portionSize:    0,
    valueForMoney:  0,
    issues: [],
    specificDishFeedback: "",
    suggestions: "",
    wouldRecommendChange: "Neutral",
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

  const deriveSeverity = (rating) => {
    if (rating <= 1) return "critical";
    if (rating <= 2) return "high";
    if (rating <= 3) return "medium";
    return "low";
  };

  const validate = () => {
    if (!form.title.trim()) return "Please provide a short complaint title / summary.";
    if (!form.specificDishFeedback.trim()) return "Please provide a complaint description.";
    const required = ["overallRating","foodQuality","hygiene","serviceSpeed","portionSize","valueForMoney"];
    for (const r of required) {
      if (!form[r] || form[r] < 1) return `Please rate: ${RATINGS.find(x => x.key === r)?.label}`;
    }
    return "";
  };

  const [complaintId, setComplaintId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user-info") || "{}");
    try {
      const res = await api.post("/welfare/submit", {
        complaintType: "mess",
        userId:        user._id || user.id,
        studentEmail:  email,
        studentName:   name,
        title:         form.title.trim(),
        description:   form.specificDishFeedback.trim(),
        severity:      deriveSeverity(form.overallRating),
        mealType:      form.mealType,
        mealDate:      form.date,
        overallRating: form.overallRating,
        foodQuality:   form.foodQuality,
        hygiene:       form.hygiene,
        serviceSpeed:  form.serviceSpeed,
        portionSize:   form.portionSize,
        valueForMoney: form.valueForMoney,
        issues:        form.issues,
        specificDishFeedback: form.specificDishFeedback,
        suggestions:   form.suggestions,
        wouldRecommendChange: form.wouldRecommendChange,
      });
      setComplaintId(res.data.complaint?.complaintId || "");
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
          <h3>Complaint Submitted!</h3>
          {complaintId && (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: ".6rem", padding: ".6rem 1rem", margin: ".5rem 0", fontFamily: "monospace", fontSize: ".95rem", color: "#166534", fontWeight: 700 }}>
              Tracking ID: {complaintId}
            </div>
          )}
          <p>
            Thank you, {name}. Your mess complaint has been submitted and forwarded
            to the <strong>Mess Secretary</strong> for review. Use the tracking ID
            above to follow up in <em>My Complaints</em>.
          </p>
          <Link to="/student/my-complaints" style={{ fontSize: ".83rem", color: "#2a5298", marginTop: ".5rem" }}>
            View My Complaints →
          </Link>
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
        <h2>🍽️ Mess Complaint Form</h2>
        <p>
          Report a mess-related complaint with clear details. Your complaint goes
          directly to the <strong>Mess Secretary</strong> for action.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Complaint Title ── */}
        <div className="sf-row" style={{ marginBottom: 0 }}>
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Complaint Title / Summary <span className="req">*</span></label>
            <input
              className="sf-input"
              placeholder="e.g. Stale food served"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>
        </div>

        {/* ── Section 1: Identity & Meal Info ── */}
        <div className="sf-section-title">1. Meal Details</div>
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
            <label>Meal Type <span className="req">*</span></label>
            <select className="sf-select" value={form.mealType} onChange={(e) => set("mealType", e.target.value)} required>
              {["Breakfast","Lunch","Snacks","Dinner"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="sf-field">
            <label>Date <span className="req">*</span></label>
            <input type="date" className="sf-input" value={form.date} max={todayStr()} onChange={(e) => set("date", e.target.value)} required />
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
        <div className="sf-section-title">3. Issues Observed  (select all that apply)</div>
        <div className="sf-checks-grid">
          {ISSUES.map((issue) => (
            <label key={issue} className="sf-check-item">
              <input
                type="checkbox"
                checked={form.issues.includes(issue)}
                onChange={() => toggleIssue(issue)}
              />
              {issue}
            </label>
          ))}
        </div>

        {/* ── Section 4: Open-ended ── */}
        <div className="sf-section-title">4. Detailed Feedback</div>
        <div className="sf-row">
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Complaint Description <span className="req">*</span></label>
            <textarea
              className="sf-textarea"
              placeholder="e.g. Monday's dal was undercooked; the roti was hard and cold..."
              value={form.specificDishFeedback}
              onChange={(e) => set("specificDishFeedback", e.target.value)}
              rows={3}
            />
          </div>
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Suggestions for Improvement</label>
            <textarea
              className="sf-textarea"
              placeholder="e.g. Please add regional cuisine on weekends; improve breakfast variety..."
              value={form.suggestions}
              onChange={(e) => set("suggestions", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* ── Section 5: Recommendation ── */}
        <div className="sf-section-title">5. Overall Perception</div>
        <div className="sf-row">
          <div className="sf-field">
            <label>Mess improvement is urgently needed</label>
            <select className="sf-select" value={form.wouldRecommendChange} onChange={(e) => set("wouldRecommendChange", e.target.value)}>
              {["Strongly Agree","Agree","Neutral","Disagree","Strongly Disagree"].map(o => <option key={o}>{o}</option>)}
            </select>
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
            {loading ? "Submitting…" : "Submit Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessFeedbackForm;
