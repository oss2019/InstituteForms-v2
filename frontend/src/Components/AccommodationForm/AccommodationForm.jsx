import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import "../../Pages/Student Portal/StudentPortal.css";

const ISSUE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Furniture / Fixtures",
  "Cleanliness",
  "Pest Control",
  "Civil / Structural",
  "Network / Wi-Fi",
  "Security",
  "Laundry",
  "Water Supply",
  "Heating / Cooling",
  "Other",
];

const HOSTEL_BLOCKS = [
  "H1 – Boys Hostel",
  "H2 – Boys Hostel",
  "H3 – Boys Hostel",
  "H4 – Boys Hostel",
  "Girls Hostel",
  "Faculty Quarters",
  "Other",
];

const todayStr = () => new Date().toISOString().split("T")[0];

const AccommodationForm = () => {
  const user  = JSON.parse(localStorage.getItem("user-info") || "{}");
  const email = user.email || "";
  const name  = user.name  || email.split("@")[0] || "";

  const initState = {
    rollNumber:    "",
    contactNumber: "",
    hostelBlock:   "H1 – Boys Hostel",
    roomNumber:    "",
    issueCategory: "Plumbing",
    issueDescription: "",
    priorityLevel: "Medium",
    preferredResolutionDate: "",
    attachmentUrl: "",
    contactPreference: "Email",
  };

  const [form, setForm]           = useState(initState);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.rollNumber.trim())       return "Roll number is required.";
    if (!form.contactNumber.trim())    return "Contact number is required.";
    if (!form.roomNumber.trim())       return "Room number is required.";
    if (!form.issueDescription.trim()) return "Please describe the issue in detail.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/feedback/accommodation", {
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
          <h3>Request Submitted!</h3>
          <p>
            Your accommodation request has been recorded. The{" "}
            <strong>Hostel Management</strong> team will review your issue and
            reach out via your preferred contact method.
          </p>
          <button className="sf-btn-submit" style={{ marginTop: ".5rem" }} onClick={() => { setForm(initState); setSubmitted(false); }}>
            Submit Another Request
          </button>
          <Link to="/student" style={{ fontSize: ".83rem", color: "#2a5298", marginTop: ".5rem" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const priorityColors = { Low: "#6b7a8d", Medium: "#c9a227", High: "#e57b22", Urgent: "#e53e3e" };
  const pColor = priorityColors[form.priorityLevel] || "#6b7a8d";

  return (
    <div className="sf-page">
      <div className="sf-header">
        <h2>🏠 Accommodation &amp; Hostel Complaint Form</h2>
        <p>
          Report hostel maintenance issues, facility complaints or raise requests.
          Submissions are forwarded to the <strong>Hostel Management / Warden</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Section 1: Personal Info ── */}
        <div className="sf-section-title">1. Personal Information</div>
        <div className="sf-row">
          <div className="sf-field">
            <label>Full Name</label>
            <input className="sf-input" value={name} readOnly />
          </div>
          <div className="sf-field">
            <label>Email</label>
            <input className="sf-input" value={email} readOnly />
          </div>
          <div className="sf-field">
            <label>Roll Number <span className="req">*</span></label>
            <input
              className="sf-input"
              placeholder="e.g. 22bme001"
              value={form.rollNumber}
              onChange={(e) => set("rollNumber", e.target.value)}
              required
            />
          </div>
          <div className="sf-field">
            <label>Contact Number <span className="req">*</span></label>
            <input
              className="sf-input"
              type="tel"
              placeholder="10-digit mobile number"
              value={form.contactNumber}
              onChange={(e) => set("contactNumber", e.target.value)}
              required
            />
          </div>
        </div>

        {/* ── Section 2: Room Info ── */}
        <div className="sf-section-title">2. Room &amp; Hostel Details</div>
        <div className="sf-row">
          <div className="sf-field">
            <label>Hostel Block <span className="req">*</span></label>
            <select className="sf-select" value={form.hostelBlock} onChange={(e) => set("hostelBlock", e.target.value)} required>
              {HOSTEL_BLOCKS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="sf-field">
            <label>Room Number <span className="req">*</span></label>
            <input
              className="sf-input"
              placeholder="e.g. 204"
              value={form.roomNumber}
              onChange={(e) => set("roomNumber", e.target.value)}
              required
            />
          </div>
        </div>

        {/* ── Section 3: Issue Details ── */}
        <div className="sf-section-title">3. Issue Details</div>
        <div className="sf-row">
          <div className="sf-field">
            <label>Issue Category <span className="req">*</span></label>
            <select className="sf-select" value={form.issueCategory} onChange={(e) => set("issueCategory", e.target.value)} required>
              {ISSUE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sf-field">
            <label>
              Priority Level
              <span style={{ marginLeft: ".5rem", fontSize: ".74rem", fontWeight: 700, color: pColor }}>
                [{form.priorityLevel}]
              </span>
            </label>
            <select className="sf-select" value={form.priorityLevel} onChange={(e) => set("priorityLevel", e.target.value)}>
              {["Low","Medium","High","Urgent"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="sf-row">
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Detailed Description of Issue <span className="req">*</span></label>
            <textarea
              className="sf-textarea"
              placeholder="Describe the problem in detail. Include when it started, how severe it is, and any steps you've already taken..."
              value={form.issueDescription}
              onChange={(e) => set("issueDescription", e.target.value)}
              rows={5}
              required
            />
          </div>
        </div>

        {/* ── Section 4: Additional Info ── */}
        <div className="sf-section-title">4. Additional Information</div>
        <div className="sf-row">
          <div className="sf-field">
            <label>Preferred Resolution Date</label>
            <input
              type="date"
              className="sf-input"
              min={todayStr()}
              value={form.preferredResolutionDate}
              onChange={(e) => set("preferredResolutionDate", e.target.value)}
            />
          </div>
          <div className="sf-field">
            <label>Preferred Contact Method</label>
            <select className="sf-select" value={form.contactPreference} onChange={(e) => set("contactPreference", e.target.value)}>
              {["Email","Phone","WhatsApp","In-Person"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="sf-row">
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Photo / Document URL  <span style={{ color: "#6b7a8d", fontWeight: 400 }}>(optional)</span></label>
            <input
              className="sf-input"
              type="url"
              placeholder="Paste a Google Drive / image link to support your complaint"
              value={form.attachmentUrl}
              onChange={(e) => set("attachmentUrl", e.target.value)}
            />
          </div>
        </div>

        <div
          style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: ".55rem", padding: ".75rem 1rem", fontSize: ".8rem", color: "#78350f", marginTop: ".75rem", lineHeight: 1.5 }}
        >
          ℹ️ By submitting this form you confirm the information is accurate. False
          complaints may result in disciplinary action as per institute norms.
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
            {loading ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccommodationForm;
