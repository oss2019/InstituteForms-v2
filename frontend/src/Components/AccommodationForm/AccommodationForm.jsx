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

const HOSTEL_BLOCKS = ["Hostel 1", "Hostel 2"];

const todayStr = () => new Date().toISOString().split("T")[0];

const AccommodationForm = () => {
  const user  = JSON.parse(localStorage.getItem("user-info") || "{}");
  const email = user.email || "";
  const name  = user.name  || email.split("@")[0] || "";

  const initState = {
    title:         "",
    rollNumber:    "",
    contactNumber: "",
    hostelBlock:   "Hostel 1",
    roomNumber:    "",
    issueCategory: "Plumbing",
    issueDescription: "",
    priorityLevel: "Medium",
    preferredResolutionDate: "",
    attachmentUrl: "",
  };

  const [form, setForm]           = useState(initState);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const priorityToSeverity = { Low: "low", Medium: "medium", High: "high", Urgent: "critical" };

  const validate = () => {
    if (!form.title.trim())          return "Please provide a short complaint title / summary.";
    if (!form.rollNumber.trim())     return "Roll number is required.";
    if (!form.contactNumber.trim())  return "Contact number is required.";
    if (!/^\d{10}$/.test(form.contactNumber)) return "Contact number must be exactly 10 digits.";
    if (!form.roomNumber.trim())     return "Room number is required.";
    if (!form.issueDescription.trim()) return "Please describe the issue in detail.";
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
        complaintType:           "hostel",
        userId:                  user._id || user.id,
        studentEmail:            email,
        studentName:             name,
        title:                   form.title.trim(),
        description:             form.issueDescription.trim(),
        severity:                priorityToSeverity[form.priorityLevel] || "medium",
        rollNumber:              form.rollNumber,
        contactNumber:           form.contactNumber,
        hostelBlock:             form.hostelBlock,
        roomNumber:              form.roomNumber,
        issueCategory:           form.issueCategory,
        issueDescription:        form.issueDescription,
        priorityLevel:           form.priorityLevel,
        preferredResolutionDate: form.preferredResolutionDate || undefined,
        attachmentUrl:           form.attachmentUrl,
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
            Your hostel complaint has been recorded and forwarded to the{" "}
            <strong>General Secretary - Hostel</strong>. Use the tracking ID above
            to follow up in <em>My Complaints</em>.
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

  const priorityColors = { Low: "#6b7a8d", Medium: "#c9a227", High: "#e57b22", Urgent: "#e53e3e" };
  const pColor = priorityColors[form.priorityLevel] || "#6b7a8d";

  return (
    <div className="sf-page">
      <div className="sf-header">
        <h2>🏠 Hostel Complaint Form</h2>
        <p>
          Report hostel issues and maintenance requirements. Your complaint
          follows the hostel workflow and is forwarded to the <strong>General
          Secretary - Hostel</strong> first.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Complaint Title ── */}
        <div className="sf-row" style={{ marginBottom: 0 }}>
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}>
            <label>Complaint Title / Summary <span className="req">*</span></label>
            <input
              className="sf-input"
              placeholder="e.g. Water leakage in room"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>
        </div>

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
              onChange={(e) => set("contactNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />
          </div>
        </div>

        {/* ── Section 2: Room Info ── */}
        <div className="sf-section-title">2. Accommodation Details</div>
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
            {loading ? "Submitting…" : "Submit Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccommodationForm;
