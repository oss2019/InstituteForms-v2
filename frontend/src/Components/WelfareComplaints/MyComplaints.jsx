import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getMyWelfareComplaints, replyToWelfareQuery } from "../../api/api";
import "../../Pages/Student Portal/StudentPortal.css";
import "./WelfareComplaints.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

const rLabel = (r) =>
  r.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Approval Timeline (student-facing) ────────────────────────────────────────
const Timeline = ({ approvals }) => (
  <div className="wc-timeline">
    <h4>Progress</h4>
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
            <span className="wc-timeline__role">{rLabel(a.role)}</span>
            <div className="wc-timeline__body">
              <span className={`wc-badge wc-badge--${a.status}`}>{a.status}</span>
              {a.arrivedAt && (
                <div className="wc-timeline__info">Received: {fmtTime(a.arrivedAt)}</div>
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

// ── Query reply form ──────────────────────────────────────────────────────────
const QueryReplyForm = ({ complaintMongoId, query, onReplied }) => {
  const [reply, setReply]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reply.trim()) return toast.error("Reply cannot be empty.");
    setLoading(true);
    try {
      await replyToWelfareQuery({
        complaintMongoId,
        queryId: query.queryId,
        reply:   reply.trim(),
      });
      toast.success("Reply submitted successfully.");
      onReplied();
    } catch {
      toast.error("Failed to submit reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wc-reply-form">
      <textarea
        rows={3}
        placeholder="Type your reply here…"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <button
        className="wc-submit-btn"
        onClick={submit}
        disabled={loading}
        style={{ marginTop: ".5rem" }}
      >
        {loading ? "Sending…" : "Submit Reply"}
      </button>
    </div>
  );
};

// ── Single complaint card (student view) ──────────────────────────────────────
const ComplaintCard = ({ complaint, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);

  const unanswered = complaint.queries?.filter((q) => q.status === "Unanswered") || [];
  const needsReply = unanswered.length > 0;

  return (
    <div
      className={`wc-card ${expanded ? "wc-card--expanded" : ""}`}
      style={needsReply ? { borderColor: "#f59e0b", boxShadow: "0 0 0 2px #fde68a44" } : {}}
    >
      {/* Header */}
      <div className="wc-card__header" onClick={() => setExpanded((e) => !e)}>
        <span className="wc-card__id">{complaint.complaintId || "—"}</span>
        <span className={`wc-badge wc-badge--${complaint.complaintType}`}>
          {complaint.complaintType}
        </span>
        <span className="wc-card__title">{complaint.title}</span>
        <span className={`wc-badge wc-badge--${complaint.status}`}>
          {complaint.status}
        </span>
        {needsReply && (
          <span className="wc-badge wc-badge--Unanswered">⚠ Reply Needed</span>
        )}
        <span className="wc-card__meta">{fmt(complaint.createdAt)}</span>
        <span style={{ fontSize: ".82rem", color: "#8da0bb" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="wc-detail">
          {/* Description */}
          <p className="wc-detail__desc">{complaint.description}</p>

          {/* Fine notice */}
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

          {/* Queries from authorities */}
          {complaint.queries?.length > 0 && (
            <div className="wc-queries">
              <h4>Queries from Authorities</h4>
              {complaint.queries.map((q, i) => (
                <div key={i} className="wc-query-item">
                  <div className="wc-query-item__meta">
                    {rLabel(q.askerRole)} asked
                    <span>{fmtTime(q.raisedAt)}</span>
                    <span className={`wc-badge wc-badge--${q.status}`}>
                      {q.status}
                    </span>
                  </div>
                  <div className="wc-query-item__q">{q.questionText}</div>
                  {q.studentReply ? (
                    <div className="wc-query-item__answer">
                      <strong>Your reply:</strong> {q.studentReply}
                    </div>
                  ) : (
                    <QueryReplyForm
                      complaintMongoId={complaint._id}
                      query={q}
                      onReplied={onRefresh}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main MyComplaints page ────────────────────────────────────────────────────
const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);

  const user   = JSON.parse(localStorage.getItem("user-info") || "{}");
  const userId = localStorage.getItem("userID") || user._id || "";

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getMyWelfareComplaints({ userId });
      setComplaints(res.data.complaints || []);
    } catch {
      toast.error("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="wc-loading">Loading your complaints…</div>;
  }

  const open   = complaints.filter((c) => c.status === "Pending");
  const closed = complaints.filter((c) => c.status !== "Pending");
  const needsReply = open.filter((c) =>
    c.queries?.some((q) => q.status === "Unanswered")
  ).length;

  return (
    <div className="sf-page">
      <div className="sf-header">
        <h2>My Complaints</h2>
        <p className="sf-subtitle">
          Track all welfare complaints you have submitted.
          {needsReply > 0 && (
            <span
              style={{
                marginLeft: ".75rem",
                background: "#fef3c7",
                color: "#92400e",
                padding: ".2rem .7rem",
                borderRadius: "999px",
                fontSize: ".78rem",
                fontWeight: 700,
              }}
            >
              {needsReply} complaint{needsReply > 1 ? "s" : ""} need your reply
            </span>
          )}
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="wc-empty">
          <div className="wc-empty__icon">📭</div>
          <p>You haven&apos;t submitted any welfare complaints yet.</p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <>
              <div
                style={{
                  fontSize: ".73rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#8da0bb",
                  letterSpacing: ".07em",
                  margin: "0 0 .75rem",
                }}
              >
                Open ({open.length})
              </div>
              {open.map((c) => (
                <ComplaintCard key={c._id} complaint={c} onRefresh={load} />
              ))}
            </>
          )}

          {closed.length > 0 && (
            <>
              <div
                style={{
                  fontSize: ".73rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#8da0bb",
                  letterSpacing: ".07em",
                  margin: "1.5rem 0 .75rem",
                }}
              >
                Resolved / Closed ({closed.length})
              </div>
              {closed.map((c) => (
                <ComplaintCard key={c._id} complaint={c} onRefresh={load} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyComplaints;
