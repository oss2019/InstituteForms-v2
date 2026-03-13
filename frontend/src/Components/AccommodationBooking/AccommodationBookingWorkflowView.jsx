import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getAccommodationActionNeeded,
  getAllAccommodationBookingsForRole,
  handleAccommodationBookingAction,
  getAccommodationBookingSettings,
  updateAccommodationBookingSettings,
} from "../../api/api";
import "../WelfareComplaints/WelfareComplaints.css";

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "—");
const rLabel = (r) => (r || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const CHAIN = ["transit-facility", "associate-dean", "dean"];

const BookingCard = ({ booking, role, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  const myStep = booking.approvals?.find((a) => a.role === role);
  const myIndex = CHAIN.indexOf(role);
  const nextRole = CHAIN[myIndex + 1];
  const canAct = !!myStep?.arrivedAt && (myStep.status === "Pending" || myStep.status === "Queried");

  const submit = async () => {
    if (!mode) return;
    if (mode === "query" && !remark.trim()) return toast.error("Question text is required.");
    setLoading(true);
    try {
      await handleAccommodationBookingAction(booking._id, {
        role,
        action: mode,
        remark: remark.trim(),
      });
      toast.success(mode === "approve" ? "Action recorded." : "Query sent.");
      setMode(null);
      setRemark("");
      onRefresh();
    } catch {
      toast.error("Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`wc-card ${open ? "wc-card--expanded" : ""}`}>
      <div className="wc-card__header" onClick={() => setOpen((v) => !v)}>
        <span className="wc-card__id">{booking.bookingId}</span>
        <span className="wc-badge wc-badge--hostel">hostel</span>
        <span className="wc-card__title">{booking.fullName} · {booking.hostelBlock}</span>
        <span className={`wc-badge wc-badge--${booking.bookingStatus}`}>{booking.bookingStatus}</span>
        <span className="wc-card__meta">{fmt(booking.createdAt)}</span>
        <span style={{ fontSize: ".82rem", color: "#8da0bb" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="wc-detail">
          <div className="wc-detail__fields">
            <div className="wc-detail__field"><label>Name</label><p>{booking.fullName}</p></div>
            <div className="wc-detail__field"><label>Roll Number</label><p>{booking.rollNumber}</p></div>
            <div className="wc-detail__field"><label>Branch</label><p>{booking.branch}</p></div>
            <div className="wc-detail__field"><label>Course</label><p>{booking.courseOfStudy}</p></div>
            <div className="wc-detail__field"><label>Hostel & Room</label><p>{booking.hostelBlock} / {booking.hostelRoomNumber}</p></div>
            <div className="wc-detail__field"><label>Email</label><p>{booking.emailId}</p></div>
            <div className="wc-detail__field"><label>Contact</label><p>{booking.contactNumber}</p></div>
            <div className="wc-detail__field"><label>Family Name</label><p>{booking.immediateFamilyName}</p></div>
            <div className="wc-detail__field"><label>Total Individuals</label><p>{booking.totalIndividuals}</p></div>
            <div className="wc-detail__field"><label>Rooms Required</label><p>{booking.numberOfRoomsRequired}</p></div>
            <div className="wc-detail__field"><label>Room Type</label><p>{booking.roomOccupancyType}</p></div>
            <div className="wc-detail__field"><label>Arrival</label><p>{fmt(booking.arrivalDateTime)}</p></div>
            <div className="wc-detail__field"><label>Departure</label><p>{fmt(booking.departureDateTime)}</p></div>
            <div className="wc-detail__field"><label>Purpose</label><p>{booking.purposeOfVisit}</p></div>
            <div className="wc-detail__field"><label>Parents Address + Mobile</label><p>{booking.parentsAddressWithMobile}</p></div>
          </div>

          <div className="wc-timeline">
            <h4>Workflow Timeline</h4>
            <div className="wc-timeline__rows">
              {(booking.approvals || []).map((a, i) => (
                <div key={i} className={`wc-timeline__row ${a.status === "Approved" ? "wc-timeline__row--done" : a.status === "Queried" ? "wc-timeline__row--queried" : a.arrivedAt ? "wc-timeline__row--active" : ""}`}>
                  <span className="wc-timeline__role">{rLabel(a.role)}</span>
                  <div className="wc-timeline__body">
                    <span className={`wc-badge wc-badge--${a.status}`}>{a.status}</span>
                    {a.arrivedAt && <div className="wc-timeline__info">Received: {fmt(a.arrivedAt)}</div>}
                    {a.actionAt && <div className="wc-timeline__info">Acted: {fmt(a.actionAt)}</div>}
                    {a.remark && <div className="wc-timeline__remark">"{a.remark}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {booking.queries?.length > 0 && (
            <div className="wc-queries">
              <h4>Queries</h4>
              {booking.queries.map((q, i) => (
                <div key={i} className="wc-query-item">
                  <div className="wc-query-item__meta">{rLabel(q.askerRole)} asked · {fmt(q.raisedAt)} · <span className={`wc-badge wc-badge--${q.status}`}>{q.status}</span></div>
                  <div className="wc-query-item__q">{q.questionText}</div>
                  {q.studentReply && <div className="wc-query-item__answer"><strong>Student replied:</strong> {q.studentReply}</div>}
                </div>
              ))}
            </div>
          )}

          {canAct && (
            <div className="wc-action-panel">
              <h4>Take Action</h4>
              <div className="wc-action-btns">
                <button className={`wc-action-btn wc-action-btn--resolve ${mode === "approve" ? "wc-action-btn--active" : ""}`} onClick={() => setMode(mode === "approve" ? null : "approve")}>
                  ✔ {nextRole ? `Approve & Send to ${rLabel(nextRole)}` : "Final Approve"}
                </button>
                <button className={`wc-action-btn wc-action-btn--query ${mode === "query" ? "wc-action-btn--active" : ""}`} onClick={() => setMode(mode === "query" ? null : "query")}>
                  ? Query Student
                </button>
              </div>

              {mode === "query" && (
                <div className="wc-action-input">
                  <label>Question *</label>
                  <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Ask for clarification..." />
                </div>
              )}

              {mode && (
                <button className="wc-submit-btn" onClick={submit} disabled={loading}>
                  {loading ? "Submitting..." : "Confirm"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TransitSettings = ({ role, onUpdated }) => {
  const [singlePrice, setSinglePrice] = useState("1500");
  const [doublePrice, setDoublePrice] = useState("2000");
  const [checkInTime, setCheckInTime] = useState("12:00 PM");
  const [checkOutTime, setCheckOutTime] = useState("11:00 AM");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getAccommodationBookingSettings();
      const s = res.data?.settings;
      if (!s) return;
      setSinglePrice(String(s.singleOccupancyPrice ?? 1500));
      setDoublePrice(String(s.doubleOccupancyPrice ?? 2000));
      setCheckInTime(s.checkInTime || "12:00 PM");
      setCheckOutTime(s.checkOutTime || "11:00 AM");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (role !== "transit-facility") return;
    setLoading(true);
    try {
      await updateAccommodationBookingSettings({
        role,
        singleOccupancyPrice: Number(singlePrice || 0),
        doubleOccupancyPrice: Number(doublePrice || 0),
        checkInTime,
        checkOutTime,
      });
      toast.success("Settings updated.");
      onUpdated?.();
    } catch {
      toast.error("Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  if (role !== "transit-facility") return null;

  return (
    <div className="wc-action-panel" style={{ marginBottom: ".9rem" }}>
      <h4>Accommodation Booking Settings (Transit Facility)</h4>
      <div className="wc-detail__fields">
        <div className="wc-detail__field">
          <label>Single Occupancy Price (₹)</label>
          <input className="wc-filter-input" type="number" min={0} value={singlePrice} onChange={(e) => setSinglePrice(e.target.value)} />
        </div>
        <div className="wc-detail__field">
          <label>Double Occupancy Price (₹)</label>
          <input className="wc-filter-input" type="number" min={0} value={doublePrice} onChange={(e) => setDoublePrice(e.target.value)} />
        </div>
        <div className="wc-detail__field">
          <label>Standard Check-In Time</label>
          <input className="wc-filter-input" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
        </div>
        <div className="wc-detail__field">
          <label>Standard Check-Out Time</label>
          <input className="wc-filter-input" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
        </div>
      </div>
      <button className="wc-submit-btn" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save Settings"}</button>
    </div>
  );
};

const AccommodationBookingWorkflowView = ({ role, view = "action" }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    try {
      const fn = view === "action" ? getAccommodationActionNeeded : getAllAccommodationBookingsForRole;
      const res = await fn({ role });
      setBookings(res.data?.bookings || []);
    } catch {
      toast.error("Failed to load accommodation bookings.");
    } finally {
      setLoading(false);
    }
  }, [role, view]);

  useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => (view === "action" ? "Action Needed" : "All Bookings"), [view]);

  if (loading) return <div className="wc-loading">Loading accommodation bookings...</div>;

  return (
    <div>
      <div className="wc-all-note">
        <strong>Mess Block Accommodation Booking:</strong> {title} view for {rLabel(role)}.
      </div>

      <TransitSettings role={role} onUpdated={load} />

      {bookings.length === 0 ? (
        <div className="wc-empty">
          <div className="wc-empty__icon">📭</div>
          <p>{view === "action" ? "No booking requests need your action right now." : "No booking requests found."}</p>
        </div>
      ) : bookings.map((b) => (
        <BookingCard key={b._id} booking={b} role={role} onRefresh={load} />
      ))}
    </div>
  );
};

export default AccommodationBookingWorkflowView;
