import { useState } from "react";
import toast from "react-hot-toast";
import { submitWelfareComplaint } from "../../api/api";
import "../../Pages/Student Portal/StudentPortal.css";
import "./WelfareComplaints.css";

// ── Static data ───────────────────────────────────────────────────────────────
const TYPES = [
  {
    value: "mess",
    emoji: "🍽️",
    label: "Mess",
    desc:  "Food quality, hygiene, service speed, portion issues",
    cls:   "sp-quick-card__icon--mess",
  },
  {
    value: "canteen",
    emoji: "☕",
    label: "Canteen",
    desc:  "Outlet quality, pricing, hygiene, staff behaviour",
    cls:   "sp-quick-card__icon--canteen",
  },
  {
    value: "accommodation",
    emoji: "🏠",
    label: "Accommodation",
    desc:  "Room maintenance, utilities, facilities, security",
    cls:   "sp-quick-card__icon--accom",
  },
];

const SEVERITIES = [
  { value: "low",      label: "Low",      hint: "Minor inconvenience" },
  { value: "medium",   label: "Medium",   hint: "Affects daily experience" },
  { value: "high",     label: "High",     hint: "Significant disruption" },
  { value: "critical", label: "Critical", hint: "Health / safety concern" },
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Snacks", "Dinner"];

const ISSUE_CATEGORIES = [
  "Plumbing / Water Supply",
  "Electrical / Power",
  "Wi-Fi / Internet",
  "Furniture / Equipment",
  "Cleanliness / Pest Control",
  "Security / Safety",
  "Laundry",
  "Noise / Disturbance",
  "Other",
];

const todayStr = () => new Date().toISOString().split("T")[0];

// ── Success screen ────────────────────────────────────────────────────────────
const SuccessScreen = ({ complaint, onReset }) => (
  <div className="sf-page" style={{ textAlign: "center", padding: "3rem 2rem" }}>
    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
    <h2 style={{ color: "#1e3a5f", marginBottom: ".5rem" }}>Complaint Submitted</h2>
    <p style={{ color: "#6b7a8d", marginBottom: "1.5rem" }}>
      Your complaint has been registered and forwarded to the relevant secretary.
    </p>
    <div
      style={{
        display: "inline-block",
        background: "#f0f4f8",
        border: "1.5px solid #dde4ef",
        borderRadius: ".8rem",
        padding: "1rem 1.75rem",
        textAlign: "left",
        marginBottom: "2rem",
      }}
    >
      <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", color: "#8da0bb", letterSpacing: ".07em", marginBottom: ".3rem" }}>
        Tracking ID
      </div>
      <div style={{ fontFamily: "monospace", fontSize: "1rem", color: "#2a5298", fontWeight: 700 }}>
        {complaint.complaintId}
      </div>
      <div style={{ fontSize: ".78rem", color: "#6b7a8d", marginTop: ".4rem" }}>
        Check <strong>My Complaints</strong> to track status and reply to queries.
      </div>
    </div>
    <br />
    <button className="wc-submit-btn" onClick={onReset}>
      Submit Another Complaint
    </button>
  </div>
);

// ── Main form ─────────────────────────────────────────────────────────────────
const WelfareComplaintForm = () => {
  const user   = JSON.parse(localStorage.getItem("user-info") || "{}");
  const userId = localStorage.getItem("userID") || user._id || "";

  const [step, setStep]               = useState(1);   // 1 = type, 2 = form
  const [complaintType, setType]      = useState("");
  const [submitted, setSubmitted]     = useState(null);
  const [loading, setLoading]         = useState(false);

  const [form, setForm] = useState({
    title:       "",
    description: "",
    severity:    "medium",
    // mess
    mealType: "Lunch",
    mealDate: todayStr(),
    // canteen
    outletName: "",
    visitDate:  todayStr(),
    // accommodation
    rollNumber:         user.rollNumber || "",
    contactNumber:      "",
    accommodationBlock: "",
    roomNumber:         "",
    issueCategory:      "Other",
    issueDescription:   "",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())       return toast.error("Title is required.");
    if (!form.description.trim()) return toast.error("Description is required.");

    setLoading(true);
    try {
      const payload = {
        complaintType,
        userId,
        studentEmail: user.email || "",
        studentName:  user.name  || user.email?.split("@")[0] || "",
        title:        form.title.trim(),
        description:  form.description.trim(),
        severity:     form.severity,
        ...(complaintType === "mess"
          ? { mealType: form.mealType, mealDate: form.mealDate }
          : {}),
        ...(complaintType === "canteen"
          ? { outletName: form.outletName, visitDate: form.visitDate }
          : {}),
        ...(complaintType === "accommodation"
          ? {
              rollNumber:         form.rollNumber,
              contactNumber:      form.contactNumber,
              accommodationBlock: form.accommodationBlock,
              roomNumber:         form.roomNumber,
              issueCategory:      form.issueCategory,
              issueDescription:   form.issueDescription,
            }
          : {}),
      };

      const res = await submitWelfareComplaint(payload);
      setSubmitted(res.data.complaint);
      toast.success("Complaint submitted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setType("");
    setSubmitted(null);
    setForm((f) => ({
      ...f,
      title: "", description: "", severity: "medium",
      mealDate: todayStr(), outletName: "", visitDate: todayStr(),
      contactNumber: "", accommodationBlock: "", roomNumber: "",
      issueCategory: "Other", issueDescription: "",
    }));
  };

  // ── Success screen ─────────────────────────────────────────────
  if (submitted) return <SuccessScreen complaint={submitted} onReset={reset} />;

  // ── Step 1: type selector ──────────────────────────────────────
  if (step === 1) {
    return (
      <div className="sf-page">
        <div className="sf-header">
          <h2>Submit a Welfare Complaint</h2>
          <p className="sf-subtitle">
            Select the category of your complaint. It will be routed to the
            relevant secretary for review.
          </p>
        </div>
        <div className="sp-quick-grid" style={{ maxWidth: "700px" }}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              className="sp-quick-card"
              style={{ border: "none", textAlign: "left", cursor: "pointer" }}
              onClick={() => { setType(t.value); setStep(2); }}
            >
              <div className={`sp-quick-card__icon ${t.cls}`}>{t.emoji}</div>
              <h3>{t.label}</h3>
              <p>{t.desc}</p>
              <span className="sp-quick-card__arrow">Select →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: details form ───────────────────────────────────────
  const typeInfo = TYPES.find((t) => t.value === complaintType);

  return (
    <div className="sf-page">
      <div className="sf-header">
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#2a5298", fontSize: ".88rem", fontWeight: 700, padding: 0,
            }}
          >
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>
            {typeInfo?.emoji} {typeInfo?.label} Complaint
          </h2>
          <span className={`wc-badge wc-badge--${complaintType}`}>{complaintType}</span>
        </div>
        <p className="sf-subtitle" style={{ marginTop: ".5rem" }}>
          This complaint will be reviewed by the{" "}
          {complaintType === "mess"
            ? "Mess Secretary"
            : complaintType === "canteen"
            ? "Canteen Secretary"
            : "Accommodation Secretary"}
          .
        </p>
      </div>

      <form onSubmit={handleSubmit} className="sf-body">
        {/* Title */}
        <div className="sf-field">
          <label className="sf-label">
            Complaint Title <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            className="sf-input"
            type="text"
            placeholder="One-line summary of the issue"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>

        {/* Severity */}
        <div className="sf-field">
          <label className="sf-label">Severity</label>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            {SEVERITIES.map((s) => (
              <label
                key={s.value}
                style={{
                  display: "flex", alignItems: "center", gap: ".4rem",
                  cursor: "pointer", padding: ".4rem .85rem", borderRadius: ".5rem",
                  border: `2px solid ${form.severity === s.value ? "#2a5298" : "#dde4ef"}`,
                  background: form.severity === s.value ? "#eff4ff" : "#fff",
                  fontSize: ".83rem", fontWeight: 600, userSelect: "none",
                  transition: "all .15s",
                }}
              >
                <input
                  type="radio"
                  name="severity"
                  value={s.value}
                  checked={form.severity === s.value}
                  onChange={() => set("severity", s.value)}
                  style={{ display: "none" }}
                />
                {s.label}
                <span style={{ fontWeight: 400, color: "#8da0bb", fontSize: ".75rem" }}>
                  ({s.hint})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="sf-field">
          <label className="sf-label">
            Description <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            className="sf-textarea"
            rows={5}
            placeholder="Describe the issue in detail — include date, time, location, and specific observations."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </div>

        {/* ── Mess-specific ─────────────────────────────────── */}
        {complaintType === "mess" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="sf-field">
              <label className="sf-label">Meal Type</label>
              <select
                className="sf-select"
                value={form.mealType}
                onChange={(e) => set("mealType", e.target.value)}
              >
                {MEAL_TYPES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="sf-field">
              <label className="sf-label">Date of Meal</label>
              <input
                className="sf-input"
                type="date"
                value={form.mealDate}
                onChange={(e) => set("mealDate", e.target.value)}
                max={todayStr()}
              />
            </div>
          </div>
        )}

        {/* ── Canteen-specific ──────────────────────────────── */}
        {complaintType === "canteen" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="sf-field">
              <label className="sf-label">Outlet Name</label>
              <input
                className="sf-input"
                type="text"
                placeholder="e.g. Main Canteen, Tea Stall"
                value={form.outletName}
                onChange={(e) => set("outletName", e.target.value)}
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">Visit Date</label>
              <input
                className="sf-input"
                type="date"
                value={form.visitDate}
                onChange={(e) => set("visitDate", e.target.value)}
                max={todayStr()}
              />
            </div>
          </div>
        )}

        {/* ── Accommodation-specific ────────────────────────── */}
        {complaintType === "accommodation" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="sf-field">
              <label className="sf-label">Block</label>
              <input
                className="sf-input"
                type="text"
                placeholder="e.g. Block A"
                value={form.accommodationBlock}
                onChange={(e) => set("accommodationBlock", e.target.value)}
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">Room Number</label>
              <input
                className="sf-input"
                type="text"
                placeholder="e.g. 204"
                value={form.roomNumber}
                onChange={(e) => set("roomNumber", e.target.value)}
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">Contact Number</label>
              <input
                className="sf-input"
                type="tel"
                placeholder="Your mobile number"
                value={form.contactNumber}
                onChange={(e) => set("contactNumber", e.target.value)}
              />
            </div>
            <div className="sf-field">
              <label className="sf-label">Issue Category</label>
              <select
                className="sf-select"
                value={form.issueCategory}
                onChange={(e) => set("issueCategory", e.target.value)}
              >
                {ISSUE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        <button type="submit" className="sf-submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
};

export default WelfareComplaintForm;
