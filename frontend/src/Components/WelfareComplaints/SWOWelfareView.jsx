import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getComplaintsForSWO } from "../../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const val = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

const formatDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN") : "—");

const downloadComplaintPdf = (complaint) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleString("en-IN");

  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text("IIT DHARWAD - STUDENT WELFARE OFFICE", pageWidth / 2, 42, { align: "center" });

  doc.setFontSize(11);
  doc.text("Welfare Complaint Record (Fine-Flagged)", pageWidth / 2, 60, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text(`Generated on: ${generatedAt}`, 40, 78);

  autoTable(doc, {
    startY: 90,
    head: [["Field", "Value"]],
    body: [
      ["Complaint ID", val(complaint.complaintId)],
      ["Complaint Type", val(complaint.complaintType)],
      ["Title", val(complaint.title)],
      ["Description", val(complaint.description)],
      ["Severity", val(complaint.severity)],
      ["Overall Status", val(complaint.status)],
      ["Student Name", val(complaint.studentName)],
      ["Student Email", val(complaint.studentEmail)],
      ["User ID", val(complaint.userId)],
      ["Submitted At", formatDateTime(complaint.createdAt)],
      ["Resolved At", formatDateTime(complaint.resolvedAt)],
      ["Resolved By", val(rLabel(complaint.resolvedBy || ""))],
      ["Fine Involved", complaint.fineInvolved ? "Yes" : "No"],
      ["Fine Note", val(complaint.fineNote)],
      ["Purchase Made for Repair", complaint.purchaseMadeForRepair ? "Yes" : "No"],
      ["Purchase Note", val(complaint.purchaseNote)],
    ],
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.5 },
    styles: { font: "times", fontSize: 9, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 160 }, 1: { cellWidth: 350 } },
  });

  const typeRows = [];
  if (complaint.complaintType === "mess") {
    typeRows.push(["Meal Type", val(complaint.mealType)]);
    typeRows.push(["Meal Date", formatDateTime(complaint.mealDate)]);
    typeRows.push(["Overall Rating", val(complaint.overallRating)]);
    typeRows.push(["Food Quality", val(complaint.foodQuality)]);
    typeRows.push(["Hygiene", val(complaint.hygiene)]);
    typeRows.push(["Service Speed", val(complaint.serviceSpeed)]);
    typeRows.push(["Portion Size", val(complaint.portionSize)]);
    typeRows.push(["Value for Money", val(complaint.valueForMoney)]);
    typeRows.push(["Issues", Array.isArray(complaint.issues) && complaint.issues.length ? complaint.issues.join(", ") : "—"]);
    typeRows.push(["Specific Dish Feedback", val(complaint.specificDishFeedback)]);
    typeRows.push(["Suggestions", val(complaint.suggestions)]);
    typeRows.push(["Would Recommend Change", val(complaint.wouldRecommendChange)]);
  }
  if (complaint.complaintType === "canteen") {
    typeRows.push(["Outlet Name", val(complaint.outletName)]);
    typeRows.push(["Visit Date", formatDateTime(complaint.visitDate)]);
    typeRows.push(["Items Purchased", val(complaint.itemsPurchased)]);
    typeRows.push(["Food Quality", val(complaint.foodQuality)]);
    typeRows.push(["Price Fairness", val(complaint.priceFairness)]);
    typeRows.push(["Hygiene Rating", val(complaint.hygieneRating)]);
    typeRows.push(["Staff Behaviour", val(complaint.staffBehaviour)]);
    typeRows.push(["Overall Rating", val(complaint.overallRating)]);
    typeRows.push(["Issues", Array.isArray(complaint.issues) && complaint.issues.length ? complaint.issues.join(", ") : "—"]);
    typeRows.push(["Suggestions", val(complaint.suggestions)]);
    typeRows.push(["Additional Comments", val(complaint.additionalComments)]);
  }
  if (complaint.complaintType === "hostel" || complaint.complaintType === "accommodation") {
    typeRows.push(["Roll Number", val(complaint.rollNumber)]);
    typeRows.push(["Contact Number", val(complaint.contactNumber)]);
    typeRows.push(["Hostel Block", val(complaint.hostelBlock || complaint.accommodationBlock)]);
    typeRows.push(["Room Number", val(complaint.roomNumber)]);
    typeRows.push(["Issue Category", val(complaint.issueCategory)]);
    typeRows.push(["Issue Description", val(complaint.issueDescription)]);
    typeRows.push(["Priority Level", val(complaint.priorityLevel)]);
    typeRows.push(["Preferred Resolution Date", formatDateTime(complaint.preferredResolutionDate)]);
    typeRows.push(["Attachment URL", val(complaint.attachmentUrl)]);
  }

  if (typeRows.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [["Form-specific Field", "Value"]],
      body: typeRows,
      theme: "grid",
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.5 },
      styles: { font: "times", fontSize: 9, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 330 } },
    });
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    head: [["Role", "Arrived At", "Step Status", "Action At", "Remark"]],
    body: (complaint.approvals || []).map((a) => [
      val(rLabel(a.role || "")),
      formatDateTime(a.arrivedAt),
      val(a.status),
      formatDateTime(a.actionAt),
      val(a.remark),
    ]),
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.5 },
    styles: { font: "times", fontSize: 9, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, cellPadding: 4 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    head: [["#", "Asker Role", "Raised At", "Question", "Student Reply", "Replied At", "Status"]],
    body: (complaint.queries && complaint.queries.length
      ? complaint.queries
      : [{ askerRole: "—", raisedAt: null, questionText: "No queries raised.", studentReply: "—", repliedAt: null, status: "—" }]
    ).map((q, i) => [
      String(i + 1),
      val(rLabel(q.askerRole || "")),
      formatDateTime(q.raisedAt),
      val(q.questionText),
      val(q.studentReply),
      formatDateTime(q.repliedAt),
      val(q.status),
    ]),
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.5 },
    styles: { font: "times", fontSize: 8.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, cellPadding: 4 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 85, doc.internal.pageSize.getHeight() - 16);
  }

  doc.save(`${complaint.complaintId || "complaint"}_record.pdf`);
};

// ── Approval timeline (read-only) ─────────────────────────────────────────────
const Timeline = ({ approvals }) => (
  <div className="wc-timeline">
    <h4>Approval Chain</h4>
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

// ── Single read-only complaint card ───────────────────────────────────────────
const SWOComplaintCard = ({ complaint }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`wc-card ${expanded ? "wc-card--expanded" : ""}`}>
      {/* Header */}
      <div className="wc-card__header" onClick={() => setExpanded((e) => !e)}>
        <span className="wc-card__id">{complaint.complaintId || "—"}</span>
        <span className={`wc-badge wc-badge--${complaint.complaintType}`}>
          {complaint.complaintType}
        </span>
        <span className="wc-card__title">{complaint.title}</span>
        {/* Fine badge always visible — this is why the card is here */}
        <span
          className="wc-badge"
          style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74" }}
        >
          {complaint.purchaseMadeForRepair ? "🧾 Repair Purchase" : "⚠ Fine Imposed"}
        </span>
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

      {/* Expanded detail — read-only */}
      {expanded && (
        <div className="wc-detail">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: ".6rem" }}>
            <button
              className="wc-submit-btn"
              style={{ background: "#111827" }}
              onClick={(e) => {
                e.stopPropagation();
                downloadComplaintPdf(complaint);
              }}
            >
              Download PDF Record
            </button>
          </div>

          {/* Fine banner */}
          <div className="wc-fine-banner">
            <div>
              <strong>
                {complaint.purchaseMadeForRepair
                  ? "🧾 Purchase Made for Repair"
                  : "⚠ Fine Imposed by Associate Dean"}
              </strong>
              {complaint.purchaseMadeForRepair && complaint.purchaseNote && <p>{complaint.purchaseNote}</p>}
              {!complaint.purchaseMadeForRepair && complaint.fineNote && <p>{complaint.fineNote}</p>}
            </div>
          </div>

          {/* Description */}
          <p className="wc-detail__desc">{complaint.description}</p>

          {/* Type-specific fields */}
          <div className="wc-detail__fields">
            <div className="wc-detail__field">
              <label>Student Name</label>
              <p>{complaint.studentName}</p>
            </div>
            <div className="wc-detail__field">
              <label>Student Email</label>
              <p>{complaint.studentEmail}</p>
            </div>
            <div className="wc-detail__field">
              <label>Complaint ID</label>
              <p style={{ fontFamily: "monospace", fontSize: ".8rem" }}>{complaint.complaintId}</p>
            </div>
            <div className="wc-detail__field">
              <label>Submitted</label>
              <p>{fmt(complaint.createdAt)}</p>
            </div>
            {complaint.mealType && (
              <div className="wc-detail__field">
                <label>Meal Type</label>
                <p>{complaint.mealType}</p>
              </div>
            )}
            {complaint.outletName && (
              <div className="wc-detail__field">
                <label>Outlet</label>
                <p>{complaint.outletName}</p>
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
            {complaint.contactNumber && (
              <div className="wc-detail__field">
                <label>Contact</label>
                <p>{complaint.contactNumber}</p>
              </div>
            )}
            {complaint.resolvedAt && (
              <div className="wc-detail__field">
                <label>Resolved At</label>
                <p>{fmt(complaint.resolvedAt)}</p>
              </div>
            )}
            {complaint.resolvedBy && (
              <div className="wc-detail__field">
                <label>Resolved By</label>
                <p>{rLabel(complaint.resolvedBy)}</p>
              </div>
            )}
          </div>

          {/* Full approval chain */}
          <Timeline approvals={complaint.approvals || []} />

          {/* Read-only notice */}
          <div
            style={{
              padding: ".65rem 1rem",
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: ".6rem",
              fontSize: ".78rem",
              color: "#8da0bb",
              marginTop: ".75rem",
            }}
          >
            SW Office has read-only access to these records. No actions can be taken from this view.
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main SWOWelfareView ───────────────────────────────────────────────────────
const SWOWelfareView = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getComplaintsForSWO();
      setComplaints(res.data.complaints || []);
    } catch {
      toast.error("Failed to load welfare complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="wc-loading">Loading welfare complaints…</div>;
  }

  return (
    <div>
      {/* Header note */}
      <div
        style={{
          background: "#fff8f0",
          border: "1.5px solid #fdba74",
          borderRadius: ".8rem",
          padding: ".75rem 1.1rem",
          marginBottom: "1.5rem",
          fontSize: ".85rem",
          color: "#92400e",
        }}
      >
        <strong>⚠ Fine-Flagged Complaints</strong> — Showing all welfare complaints
        where either a fine was imposed or a purchase-for-repair was recorded.
        Read-only view.
      </div>

      {complaints.length === 0 ? (
        <div className="wc-empty">
          <div className="wc-empty__icon">📋</div>
          <p>No fine-flagged welfare complaints at this time.</p>
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: ".73rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#8da0bb",
              letterSpacing: ".07em",
              marginBottom: ".75rem",
            }}
          >
            {complaints.length} complaint{complaints.length !== 1 ? "s" : ""} in SW documentation queue
          </div>
          {complaints.map((c) => (
            <SWOComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SWOWelfareView;
