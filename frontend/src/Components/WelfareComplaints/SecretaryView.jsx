import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getActionNeededComplaints,
  getAllComplaintsForRole,
  handleComplaintAction,
} from "../../api/api";
import "./WelfareComplaints.css";

// ── Hierarchy map (mirrors backend) ──────────────────────────────────────────
const HIERARCHIES = {
  mess:          ["mess-secretary",    "fic-mess-canteen",  "associate-dean"],
  canteen:       ["canteen-secretary", "fic-mess-canteen",  "associate-dean"],
  hostel:        ["gen-sec-hostel", "hostel-manager", "warden", "adean-hostel"],
  accommodation: ["gen-sec-hostel", "hostel-manager", "warden", "adean-hostel"],
};

// ── Formatting helpers ────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const roleLabel = (r) =>
  r.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Approval Timeline ─────────────────────────────────────────────────────────
const Timeline = ({ approvals }) => (
  <div className="wc-timeline">
    <h4>Approval Timeline</h4>
    <div className="wc-timeline__rows">
      {approvals.map((a, i) => {
        const rowCls =
          a.status === "Resolved" || a.status === "Escalated"
            ? "wc-timeline__row--done"
            : a.status === "Queried"
            ? "wc-timeline__row--queried"
            : a.arrivedAt
            ? "wc-timeline__row--active"
            : "";
        return (
          <div key={i} className={`wc-timeline__row ${rowCls}`}>
            <span className="wc-timeline__role">{roleLabel(a.role)}</span>
            <div className="wc-timeline__body">
              <span className={`wc-badge wc-badge--${a.status}`}>{a.status}</span>
              {a.arrivedAt && (
                <div className="wc-timeline__info">Received: {fmtTime(a.arrivedAt)}</div>
              )}
              {a.actionAt && (
                <div className="wc-timeline__info">Acted: {fmtTime(a.actionAt)}</div>
              )}
              {a.remark && (
                <div className="wc-timeline__remark">"{a.remark}"</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Queries read-only thread (for staff) ──────────────────────────────────────
const QueriesThread = ({ queries }) => {
  if (!queries || queries.length === 0) return null;
  return (
    <div className="wc-queries">
      <h4>Student Queries</h4>
      {queries.map((q, i) => (
        <div key={i} className="wc-query-item">
          <div className="wc-query-item__meta">
            {roleLabel(q.askerRole)} asked
            <span>{fmtTime(q.raisedAt)}</span>
            <span className={`wc-badge wc-badge--${q.status}`}>{q.status}</span>
          </div>
          <div className="wc-query-item__q">{q.questionText}</div>
          {q.studentReply ? (
            <div className="wc-query-item__answer">
              <strong>Student replied:</strong> {q.studentReply}
              <span style={{ fontSize: ".72rem", color: "#8da0bb", marginLeft: ".5rem" }}>
                {fmtTime(q.repliedAt)}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: ".78rem", color: "#8da0bb", marginTop: ".35rem", fontStyle: "italic" }}>
              Awaiting student reply…
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Action Panel ──────────────────────────────────────────────────────────────
const ActionPanel = ({ complaint, role, onDone }) => {
  const [mode, setMode]               = useState(null); // "resolve" | "escalate" | "query"
  const [remark, setRemark]           = useState("");
  const [fineInvolved, setFineInvolved] = useState(false);
  const [fineNote, setFineNote]       = useState("");
  const [purchaseMadeForRepair, setPurchaseMadeForRepair] = useState(false);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [loading, setLoading]         = useState(false);

  const myApproval = complaint.approvals?.find((a) => a.role === role);
  if (
    !myApproval ||
    !myApproval.arrivedAt ||
    (myApproval.status !== "Pending" && myApproval.status !== "Queried")
  ) {
    return null;
  }

  const chain    = HIERARCHIES[complaint.complaintType] || [];
  const myIdx    = chain.indexOf(role);
  const nextRole = chain[myIdx + 1];

  const toggleMode = (m) => {
    setMode((prev) => (prev === m ? null : m));
    setRemark("");
    setFineInvolved(false);
    setFineNote("");
    setPurchaseMadeForRepair(false);
    setPurchaseNote("");
  };

  const submit = async () => {
    if (mode === "resolve"  && !remark.trim()) return toast.error("Resolution note is mandatory.");
    if (mode === "query"    && !remark.trim()) return toast.error("Question text is mandatory.");
    setLoading(true);
    try {
      await handleComplaintAction(complaint._id, {
        role,
        action: mode,
        remark: remark.trim(),
        ...(mode === "resolve" && role === "associate-dean"
          ? { fineInvolved, fineNote: fineNote.trim() }
          : {}),
        ...(mode === "resolve" && role === "adean-hostel"
          ? { purchaseMadeForRepair, purchaseNote: purchaseNote.trim() }
          : {}),
      });
      toast.success(
        mode === "resolve"
          ? "Complaint resolved."
          : mode === "escalate"
          ? `Escalated to ${roleLabel(nextRole)}.`
          : "Query sent to student."
      );
      onDone();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wc-action-panel">
      <h4>Take Action</h4>

      <div className="wc-action-btns">
        <button
          className={`wc-action-btn wc-action-btn--resolve ${mode === "resolve" ? "wc-action-btn--active" : ""}`}
          onClick={() => toggleMode("resolve")}
        >
          ✔ Resolve
        </button>

        {nextRole && (
          <button
            className={`wc-action-btn wc-action-btn--escalate ${mode === "escalate" ? "wc-action-btn--active" : ""}`}
            onClick={() => toggleMode("escalate")}
          >
            ↑ Escalate to {roleLabel(nextRole)}
          </button>
        )}

        <button
          className={`wc-action-btn wc-action-btn--query ${mode === "query" ? "wc-action-btn--active" : ""}`}
          onClick={() => toggleMode("query")}
        >
          ? Query Student
        </button>
      </div>

      {mode === "resolve" && (
        <div className="wc-action-input">
          <label>
            Resolution Note <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            placeholder="Describe how this complaint was addressed and resolved…"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
          {role === "associate-dean" && (
            <div className="wc-fine-ticker">
              <label className="wc-fine-ticker__toggle">
                <input
                  type="checkbox"
                  checked={fineInvolved}
                  onChange={(e) => setFineInvolved(e.target.checked)}
                />
                Fine Imposed on this Complaint
              </label>
              {fineInvolved && (
                <input
                  type="text"
                  placeholder="Fine details — amount, reason, instructions…"
                  value={fineNote}
                  onChange={(e) => setFineNote(e.target.value)}
                />
              )}
            </div>
          )}
          {role === "adean-hostel" && (
            <div className="wc-fine-ticker">
              <label className="wc-fine-ticker__toggle">
                <input
                  type="checkbox"
                  checked={purchaseMadeForRepair}
                  onChange={(e) => setPurchaseMadeForRepair(e.target.checked)}
                />
                Purchase Made for Repair
              </label>
              {purchaseMadeForRepair && (
                <input
                  type="text"
                  placeholder="Purchase details — amount, item, reference..."
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                />
              )}
            </div>
          )}
          <button className="wc-submit-btn" onClick={submit} disabled={loading}>
            {loading ? "Submitting…" : "Confirm Resolution"}
          </button>
        </div>
      )}

      {mode === "escalate" && (
        <div className="wc-action-input">
          <label>Note for {roleLabel(nextRole)} (optional)</label>
          <textarea
            placeholder="Any context or observations for the next authority…"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
          <button className="wc-submit-btn" onClick={submit} disabled={loading}>
            {loading ? "Submitting…" : `Send to ${roleLabel(nextRole)}`}
          </button>
        </div>
      )}

      {mode === "query" && (
        <div className="wc-action-input">
          <label>
            Question for Student <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            placeholder="What do you need the student to clarify or provide? The complaint will be on hold until they reply."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
          <button className="wc-submit-btn" onClick={submit} disabled={loading}>
            {loading ? "Sending…" : "Send Query to Student"}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Single complaint card (accordion) ─────────────────────────────────────────
const ComplaintCard = ({ complaint, role, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`wc-card ${expanded ? "wc-card--expanded" : ""}`}>
      {/* Header row — always visible */}
      <div className="wc-card__header" onClick={() => setExpanded((e) => !e)}>
        <span className="wc-card__id">{complaint.complaintId || "—"}</span>
        <span className={`wc-badge wc-badge--${complaint.complaintType}`}>
          {complaint.complaintType}
        </span>
        <span className="wc-card__title">{complaint.title}</span>
        <span className={`wc-badge wc-badge--${complaint.status}`}>
          {complaint.status}
        </span>
        <span className="wc-card__meta">
          {complaint.studentName} · {fmt(complaint.createdAt)}
        </span>
        <span style={{ fontSize: ".82rem", color: "#8da0bb" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="wc-detail">
          {/* Description */}
          <p className="wc-detail__desc">{complaint.description}</p>

          {/* Type-specific fields */}
          <div className="wc-detail__fields">
            <div className="wc-detail__field">
              <label>Student Email</label>
              <p>{complaint.studentEmail}</p>
            </div>
            {complaint.mealType && (
              <div className="wc-detail__field">
                <label>Meal</label>
                <p>{complaint.mealType}</p>
              </div>
            )}
            {complaint.mealDate && (
              <div className="wc-detail__field">
                <label>Meal Date</label>
                <p>{fmt(complaint.mealDate)}</p>
              </div>
            )}
            {complaint.outletName && (
              <div className="wc-detail__field">
                <label>Outlet</label>
                <p>{complaint.outletName}</p>
              </div>
            )}
            {complaint.visitDate && (
              <div className="wc-detail__field">
                <label>Visit Date</label>
                <p>{fmt(complaint.visitDate)}</p>
              </div>
            )}
            {(complaint.hostelBlock || complaint.accommodationBlock) && (
              <div className="wc-detail__field">
                <label>Hostel Block</label>
                <p>{complaint.hostelBlock || complaint.accommodationBlock}</p>
              </div>
            )}
            {complaint.roomNumber && (
              <div className="wc-detail__field">
                <label>Room</label>
                <p>{complaint.roomNumber}</p>
              </div>
            )}
            {complaint.issueCategory && (
              <div className="wc-detail__field">
                <label>Issue Category</label>
                <p>{complaint.issueCategory}</p>
              </div>
            )}
            {complaint.contactNumber && (
              <div className="wc-detail__field">
                <label>Contact</label>
                <p>{complaint.contactNumber}</p>
              </div>
            )}
          </div>

          {/* Fine banner */}
          {complaint.fineInvolved && (
            <div className="wc-fine-banner">
              <div>
                <strong>⚠ Fine Imposed</strong>
                {complaint.fineNote && <p>{complaint.fineNote}</p>}
              </div>
            </div>
          )}
          {complaint.purchaseMadeForRepair && (
            <div className="wc-fine-banner">
              <div>
                <strong>🧾 Purchase Made for Repair</strong>
                {complaint.purchaseNote && <p>{complaint.purchaseNote}</p>}
              </div>
            </div>
          )}

          {/* Timeline */}
          <Timeline approvals={complaint.approvals || []} />

          {/* Queries thread */}
          <QueriesThread queries={complaint.queries} />

          {/* Action panel — only shown when this role has an active step */}
          {role && (
            <ActionPanel complaint={complaint} role={role} onDone={onRefresh} />
          )}
        </div>
      )}
    </div>
  );
};

// ── Main SecretaryView ────────────────────────────────────────────────────────
// Props:
//   role      – the logged-in user's role string
//   view      – "action" | "all"  (controlled from parent sidebar)
const SecretaryView = ({ role, view = "action" }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(false);
  const roleText = roleLabel(role || "role");
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    step: "all",
    search: "",
  });

  const roleTypes = Object.entries(HIERARCHIES)
    .filter(([, chain]) => chain.includes(role))
    .map(([type]) => type);

  const load = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    try {
      const fn  = view === "action" ? getActionNeededComplaints : getAllComplaintsForRole;
      const res = await fn({ role });
      setComplaints(res.data.complaints || []);
    } catch {
      toast.error("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  }, [role, view]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setFilters({ type: "all", status: "all", step: "all", search: "" });
  }, [role, view]);

  const filteredComplaints = complaints.filter((c) => {
    if (view !== "all") return true;

    const myStep = c.approvals?.find((a) => a.role === role);
    const myStepStatus = !myStep?.arrivedAt ? "not-reached" : (myStep?.status || "not-reached").toLowerCase();
    const searchText = `${c.complaintId || ""} ${c.title || ""} ${c.studentName || ""}`.toLowerCase();

    const byType = filters.type === "all" || c.complaintType === filters.type;
    const byStatus = filters.status === "all" || (c.status || "").toLowerCase() === filters.status;
    const byStep =
      filters.step === "all" ||
      (filters.step === "actionable" && myStep?.arrivedAt && (myStep.status === "Pending" || myStep.status === "Queried")) ||
      myStepStatus === filters.step;
    const bySearch = !filters.search.trim() || searchText.includes(filters.search.trim().toLowerCase());

    return byType && byStatus && byStep && bySearch;
  });

  if (loading) {
    return <div className="wc-loading">Loading complaints…</div>;
  }

  if (complaints.length === 0) {
    return (
      <div>
        {view === "all" && (
          <div className="wc-all-note">
            <strong>Note for {roleText}:</strong> Complaints that currently require your action are shown in the <strong>Action Needed</strong> tab.
            This <strong>All Complaints</strong> view includes all complaints for your scope across statuses (Pending, Queried, Escalated, Resolved, etc.).
          </div>
        )}
        <div className="wc-empty">
          <div className="wc-empty__icon">{view === "action" ? "✅" : "📋"}</div>
          <p>
            {view === "action"
              ? "No complaints need your attention right now."
              : "No complaints found for your role."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {view === "all" && (
        <>
          <div className="wc-all-note">
            <strong>Note for {roleText}:</strong> Complaints that currently require your action are shown in the <strong>Action Needed</strong> tab.
            This <strong>All Complaints</strong> view includes all complaints for your scope across statuses (Pending, Queried, Escalated, Resolved, etc.).
          </div>

          <div className="wc-filters">
            <select
              className="wc-filter-input"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="all">All Types</option>
              {(role === "associate-dean" ? ["mess", "canteen"] : roleTypes.filter((t, idx, arr) => arr.indexOf(t) === idx && t !== "accommodation")).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              className="wc-filter-input"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="all">All Overall Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              className="wc-filter-input"
              value={filters.step}
              onChange={(e) => setFilters((f) => ({ ...f, step: e.target.value }))}
            >
              <option value="all">All My-Step States</option>
              <option value="actionable">Action Needed for Me</option>
              <option value="not-reached">Not Reached Me Yet</option>
              <option value="pending">My Step: Pending</option>
              <option value="queried">My Step: Queried</option>
              <option value="escalated">My Step: Escalated</option>
              <option value="resolved">My Step: Resolved</option>
            </select>

            <input
              className="wc-filter-input"
              type="text"
              placeholder="Search by ID, title, student"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
        </>
      )}
      {filteredComplaints.length === 0 ? (
        <div className="wc-empty">
          <div className="wc-empty__icon">🔎</div>
          <p>No complaints match the selected filters.</p>
        </div>
      ) : filteredComplaints.map((c) => (
        <ComplaintCard
          key={c._id}
          complaint={c}
          role={role}
          onRefresh={load}
        />
      ))}
    </div>
  );
};

export default SecretaryView;
