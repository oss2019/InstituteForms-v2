import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getAccommodationBookingSettings,
  submitAccommodationBooking,
  getMyAccommodationBookings,
  replyToAccommodationBookingQuery,
} from "../../api/api";
import "../../Pages/Student Portal/StudentPortal.css";

const initialForm = {
  fullName: "",
  rollNumber: "",
  branch: "",
  courseOfStudy: "",
  hostelBlock: "Hostel 1",
  hostelRoomNumber: "",
  emailId: "",
  contactNumber: "",
  immediateFamilyName: "",
  totalIndividuals: "",
  numberOfRoomsRequired: "",
  roomOccupancyType: "Single",
  arrivalDateTime: "",
  departureDateTime: "",
  purposeOfVisit: "",
  parentsAddressWithMobile: "",
};

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "—");

const BookingQueryReply = ({ bookingId, query, onDone }) => {
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reply.trim()) return toast.error("Reply cannot be empty.");
    setLoading(true);
    try {
      await replyToAccommodationBookingQuery({ bookingMongoId: bookingId, queryId: query.queryId, reply: reply.trim() });
      toast.success("Reply submitted.");
      setReply("");
      onDone();
    } catch {
      toast.error("Failed to submit reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: ".5rem" }}>
      <textarea
        className="sf-textarea"
        rows={3}
        placeholder="Type your reply..."
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <button className="sf-btn-submit" type="button" onClick={submit} disabled={loading} style={{ marginTop: ".35rem" }}>
        {loading ? "Submitting..." : "Submit Reply"}
      </button>
    </div>
  );
};

const AccommodationBookingForm = () => {
  const user = JSON.parse(localStorage.getItem("user-info") || "{}");
  const userId = localStorage.getItem("userID") || user._id || "";

  const [form, setForm] = useState({
    ...initialForm,
    fullName: user.name || "",
    emailId: user.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [settings, setSettings] = useState({
    singleOccupancyPrice: 1500,
    doubleOccupancyPrice: 2000,
    checkInTime: "12:00 PM",
    checkOutTime: "11:00 AM",
  });
  const [bookings, setBookings] = useState([]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const loadSettings = async () => {
    try {
      const res = await getAccommodationBookingSettings();
      if (res.data?.settings) setSettings(res.data.settings);
    } catch {
      // silent fallback defaults
    }
  };

  const loadMyBookings = async () => {
    if (!userId) return;
    try {
      const res = await getMyAccommodationBookings({ userId });
      setBookings(res.data?.bookings || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSettings();
    loadMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const estimatedCost = useMemo(() => {
    const rooms = Number(form.numberOfRoomsRequired || 0);
    const unit = form.roomOccupancyType === "Single" ? Number(settings.singleOccupancyPrice || 0) : Number(settings.doubleOccupancyPrice || 0);
    return rooms > 0 ? unit * rooms : 0;
  }, [form.numberOfRoomsRequired, form.roomOccupancyType, settings]);

  const validate = () => {
    const req = [
      "fullName",
      "rollNumber",
      "branch",
      "courseOfStudy",
      "hostelBlock",
      "hostelRoomNumber",
      "emailId",
      "contactNumber",
      "immediateFamilyName",
      "totalIndividuals",
      "numberOfRoomsRequired",
      "roomOccupancyType",
      "arrivalDateTime",
      "departureDateTime",
      "purposeOfVisit",
      "parentsAddressWithMobile",
    ];

    for (const k of req) {
      if (!String(form[k] ?? "").trim()) return "All fields are mandatory.";
    }

    if (!/^\d{10}$/.test(String(form.contactNumber))) return "Contact number must be exactly 10 digits.";

    const arrival = new Date(form.arrivalDateTime);
    const departure = new Date(form.departureDateTime);
    if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) return "Arrival and departure date-time are required.";
    if (departure <= arrival) return "Departure must be after arrival.";

    if (Number(form.totalIndividuals) < 1) return "Total number of individuals must be at least 1.";
    if (Number(form.numberOfRoomsRequired) < 1) return "Number of rooms required must be at least 1.";

    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    if (!userId) return setError("Unable to identify student user. Please login again.");

    setError("");
    setLoading(true);
    try {
      const res = await submitAccommodationBooking({
        userId,
        studentName: user.name || form.fullName,
        studentEmail: user.email || form.emailId,
        ...form,
        totalIndividuals: Number(form.totalIndividuals),
        numberOfRoomsRequired: Number(form.numberOfRoomsRequired),
      });
      setBookingId(res.data?.booking?.bookingId || "");
      setSubmitted(true);
      await loadMyBookings();
    } catch (ex) {
      setError(ex.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sf-page">
      <div className="sf-header">
        <h2>🏨 Mess Block Accommodation Booking</h2>
        <p>Book guest rooms at the Mess Block (3rd Floor) for parents/relatives on a night basis.</p>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #dbe4f0", borderRadius: ".65rem", padding: ".8rem 1rem", marginBottom: "1rem", fontSize: ".85rem", color: "#334155" }}>
        <strong>Current Room Rent:</strong> Single Occupancy ₹{settings.singleOccupancyPrice} · Double Occupancy ₹{settings.doubleOccupancyPrice}
        <br />
        <strong>Standard Check-In:</strong> {settings.checkInTime} · <strong>Standard Check-Out:</strong> {settings.checkOutTime}
      </div>

      {submitted && (
        <div className="sf-success" style={{ marginBottom: "1rem" }}>
          <div className="sf-success__icon">✅</div>
          <h3>Booking Request Submitted!</h3>
          {bookingId && (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: ".6rem", padding: ".6rem 1rem", margin: ".5rem 0", fontFamily: "monospace", fontSize: ".95rem", color: "#166534", fontWeight: 700 }}>
              Booking ID: {bookingId}
            </div>
          )}
          <Link to="/student" style={{ fontSize: ".83rem", color: "#2a5298" }}>
            ← Back to Dashboard
          </Link>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <div className="sf-section-title">Applicant Details</div>
        <div className="sf-row">
          <div className="sf-field"><label>Name *</label><input className="sf-input" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required /></div>
          <div className="sf-field"><label>Roll Number *</label><input className="sf-input" value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} required /></div>
          <div className="sf-field"><label>Branch *</label><input className="sf-input" value={form.branch} onChange={(e) => set("branch", e.target.value)} required /></div>
          <div className="sf-field"><label>Course of Study *</label><input className="sf-input" value={form.courseOfStudy} onChange={(e) => set("courseOfStudy", e.target.value)} required /></div>
          <div className="sf-field"><label>Hostel Block *</label><select className="sf-select" value={form.hostelBlock} onChange={(e) => set("hostelBlock", e.target.value)}><option>Hostel 1</option><option>Hostel 2</option></select></div>
          <div className="sf-field"><label>Hostel & Room Number *</label><input className="sf-input" value={form.hostelRoomNumber} onChange={(e) => set("hostelRoomNumber", e.target.value)} required /></div>
          <div className="sf-field"><label>Email ID *</label><input type="email" className="sf-input" value={form.emailId} onChange={(e) => set("emailId", e.target.value)} required /></div>
          <div className="sf-field"><label>Contact Number *</label><input className="sf-input" value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required /></div>
        </div>

        <div className="sf-section-title">Booking Details</div>
        <div className="sf-row">
          <div className="sf-field"><label>Name of Parents / Immediate Family *</label><input className="sf-input" value={form.immediateFamilyName} onChange={(e) => set("immediateFamilyName", e.target.value)} required /></div>
          <div className="sf-field"><label>Total Individuals *</label><input type="number" min={1} className="sf-input" value={form.totalIndividuals} onChange={(e) => set("totalIndividuals", e.target.value)} required /></div>
          <div className="sf-field"><label>Number of Rooms Required *</label><input type="number" min={1} className="sf-input" value={form.numberOfRoomsRequired} onChange={(e) => set("numberOfRoomsRequired", e.target.value)} required /></div>
          <div className="sf-field"><label>Room Type *</label><select className="sf-select" value={form.roomOccupancyType} onChange={(e) => set("roomOccupancyType", e.target.value)}><option>Single</option><option>Double</option></select></div>
          <div className="sf-field"><label>Date & Approx. Time of Arrival *</label><input type="datetime-local" className="sf-input" value={form.arrivalDateTime} onChange={(e) => set("arrivalDateTime", e.target.value)} required /></div>
          <div className="sf-field"><label>Date & Approx. Time of Departure *</label><input type="datetime-local" className="sf-input" value={form.departureDateTime} onChange={(e) => set("departureDateTime", e.target.value)} required /></div>
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}><label>Purpose of Visit *</label><textarea className="sf-textarea" rows={3} value={form.purposeOfVisit} onChange={(e) => set("purposeOfVisit", e.target.value)} required /></div>
          <div className="sf-field" style={{ gridColumn: "1 / -1" }}><label>Address of Parents with Mobile Number *</label><textarea className="sf-textarea" rows={3} value={form.parentsAddressWithMobile} onChange={(e) => set("parentsAddressWithMobile", e.target.value)} required /></div>
        </div>

        <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", padding: ".7rem 1rem", borderRadius: ".5rem", fontSize: ".83rem", color: "#334155" }}>
          Estimated rent (informational): <strong>₹{estimatedCost}</strong>
        </div>

        {error && (
          <p style={{ color: "#e53e3e", fontSize: ".82rem", marginTop: ".6rem", background: "#fff5f5", padding: ".5rem .75rem", borderRadius: ".4rem", border: "1px solid #fed7d7" }}>
            ⚠️ {error}
          </p>
        )}

        <div className="sf-submit-row">
          <button type="button" className="sf-btn-reset" onClick={() => setForm({ ...initialForm, fullName: user.name || "", emailId: user.email || "" })}>Reset Form</button>
          <button type="submit" className="sf-btn-submit" disabled={loading}>{loading ? "Submitting..." : "Submit Booking Request"}</button>
        </div>
      </form>

      <div style={{ marginTop: "1.25rem" }}>
        <div className="sf-section-title">My Booking Requests</div>
        {bookings.length === 0 ? (
          <div style={{ color: "#8da0bb", fontSize: ".84rem" }}>No booking requests yet.</div>
        ) : bookings.map((b) => (
          <div key={b._id} style={{ background: "#fff", border: "1px solid #dde4ef", borderRadius: ".7rem", padding: ".75rem 1rem", marginBottom: ".6rem" }}>
            <div style={{ fontWeight: 700, color: "#1e3a5f", fontSize: ".86rem" }}>{b.bookingId} · {b.bookingStatus}</div>
            <div style={{ fontSize: ".8rem", color: "#6b7a8d" }}>Arrival: {fmt(b.arrivalDateTime)} · Departure: {fmt(b.departureDateTime)}</div>
            {b.queries?.map((q, i) => (
              <div key={i} style={{ marginTop: ".55rem", borderTop: "1px dashed #e2e8f0", paddingTop: ".55rem" }}>
                <div style={{ fontSize: ".78rem", color: "#92400e", fontWeight: 700 }}>
                  Query from {q.askerRole.replace(/-/g, " ")} · {fmt(q.raisedAt)} · {q.status}
                </div>
                <div style={{ fontSize: ".84rem", color: "#1a2b3c", marginTop: ".2rem" }}>{q.questionText}</div>
                {q.status === "Unanswered" ? (
                  <BookingQueryReply bookingId={b._id} query={q} onDone={loadMyBookings} />
                ) : (
                  <div style={{ fontSize: ".82rem", color: "#334155", marginTop: ".35rem" }}>
                    <strong>Your reply:</strong> {q.studentReply || "—"}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccommodationBookingForm;
