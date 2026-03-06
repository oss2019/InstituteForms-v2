import html2pdf from "html2pdf.js";

const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

export const generatePDF = async (formData = {}, headerImageURL = "") => {
  try {
    formData.requirements          = Array.isArray(formData.requirements)          ? formData.requirements          : [];
    formData.budgetBreakup         = Array.isArray(formData.budgetBreakup)         ? formData.budgetBreakup         : [];
    formData.proposedBudgetBreakup = Array.isArray(formData.proposedBudgetBreakup) ? formData.proposedBudgetBreakup : [];

    let headerDataUrl  = null;
    let headerHeightMM = 0;

    if (headerImageURL) {
      try {
        const res  = await fetch(headerImageURL, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        headerDataUrl = await blobToDataURL(blob);
        await new Promise((resolve) => {
          const img  = new Image();
          img.onload = () => { headerHeightMM = 210 * (img.naturalHeight / img.naturalWidth); resolve(); };
          img.onerror = resolve;
          img.src = headerDataUrl;
        });
      } catch (err) { console.warn("Header image fetch failed:", err); }
    }

    const TOP_MM = headerHeightMM > 0 ? headerHeightMM + 4 : 14;

    const opt = {
      margin      : [TOP_MM, 14, 14, 14],
      filename    : "gymkhana_event_form.pdf",
      image       : { type: "jpeg", quality: 0.98 },
      html2canvas : { scale: 2, useCORS: true, letterRendering: true },
      jsPDF       : { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak   : { mode: ["css", "legacy"] },
    };

    const pdfInstance = await html2pdf()
      .set(opt)
      .from(createHTMLContent(formData))
      .toPdf()
      .get("pdf");

    const totalPages = pdfInstance.internal.getNumberOfPages();
    const pageW      = pdfInstance.internal.pageSize.getWidth();
    const pageH      = pdfInstance.internal.pageSize.getHeight();

    for (let i = 1; i <= totalPages; i++) {
      pdfInstance.setPage(i);
      if (headerDataUrl && headerHeightMM > 0) {
        pdfInstance.addImage(headerDataUrl, "JPEG", 0, 0, pageW, headerHeightMM);
      }
      pdfInstance.setFontSize(9);
      pdfInstance.setFont("helvetica", "bold");
      pdfInstance.text(`${i} | Page`, pageW - 14, pageH - 5, { align: "right" });
    }

    const pdfBlob = pdfInstance.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const dataUrl = await blobToDataURL(pdfBlob);
    return { blob: pdfBlob, blobUrl, dataUrl };
  } catch (err) {
    console.error("generatePDF failed:", err);
    throw err;
  }
};

const createHTMLContent = (formData) => {

  const SOURCES    = ["Sports Budget", "Cultural Budget", "Technical Budget", "Others"];
  const FACILITIES = ["Security", "Transport", "IPS Related", "Housekeeping", "Refreshment", "Ambulance", "Networking"];

  const INSTRS = [
    { b: true,  t: "For reserving classrooms in CLT please contact the Academics Office with approval form." },
    { b: false, t: "For any Audio/Visual assistance please contact the Academic Office/Classroom maintenance staff." },
    { b: false, t: "For reserving rooms for external participants in Hostel blocks please contact SW Office." },
    { b: false, t: "For Network Issues/requirements please contact the CCS Office with this prior approval." },
    { b: false, t: "Event organizer team is requested to provide the Visitors ID to the all-external participants." },
    { b: false, t: "All the events to end by 11PM as notified in Hostels Rules and Regulations." },
    { b: true,  t: "All the Accounts need to settle within 2 weeks of the event conclusion, which will be responsibility of concerned GS, Treasurer and President." },
    { b: false, t: "A report is to be submitted to SW Office by the organizer after the conclusion of the event within 2 weeks." },
    { b: false, t: "If the external experts/dignitaries are invited, please mention the details." },
    { b: true,  t: "Please ensure all invoices submitted to the SW office are GST-compliant. Invoices must include GSTIN, invoice number and date, supplier and recipient details, description of goods/services, tax breakdown, total amount (in figures and words), place of supply, seal and signature, and vendor account details." },
    { b: true,  t: "To avoid delays, ensure invoices are accurate and meet all GST requirements. Additionally, anyone receiving advances must submit a settlement bill with any unspent balance within 15 days of withdrawal." },
  ];

  const NOTES = [
    { t: "Ensure all relevant permissions from security, transport, and other logistics are coordinated well in advance." },
    { t: "If media coverage is expected, inform the Public Relations/Media Cell of appropriate details through the SW office." },
    { t: "Obtain all necessary approval if any cash awards, gifts, or mementos are to be distributed." },
    { t: "Submit soft copies of event posters/flyers for brand review before circulation to SW office." },
    { html: `If the event involves competitions, clearly outline the rules and evaluation criteria in advance. <strong>The result sheet must also be submitted to the office.</strong> Additionally, students must ensure <strong>that all bills/invoices are accurate and submit them along with their bank details for reimbursement processing.</strong>` },
    { t: "Coordinate with the Institute Wellness Center if an ambulance or medical support is required." },
    { t: "Maintain proper documentation of expenses, including bills, receipts, and vendor invoices." },
    { t: "Clearly demarcate and manage entry/exit points if external attendees are expected." },
    { t: "If the event spans multiple days, ensure a daily schedule is submitted for review." },
    { t: "Use sustainable practices where possible (e.g., avoid plastic, use digital communication)." },
    { t: "Any loss or damage to institute property occurring during the event will be the sole responsibility of the General Secretary and the Event Organizer." },
    { html: `<strong>For stage play activities such as dramas, skits, or scripts, prior approval must be obtained from the concerned authorities</strong>, including club representatives and the Associate Dean. All requests should be submitted well in advance for approval by the competent authority.` },
  ];

  const srcSelected = (src) => {
    if (!formData.sourceOfBudget) return false;
    const first = src.split(" ")[0];
    return formData.sourceOfBudget === src || formData.sourceOfBudget === first || formData.sourceOfBudget.startsWith(first);
  };

  const checkbox = (checked, label) => `
    <span class="cbi">
      <span class="cb${checked ? " cbon" : ""}"></span>
      <span>${label}</span>
    </span>`;

  const signed = (role) =>
    formData.approvals?.find(a => a.role === role)?.status === "Approved"
      ? `<div class="dsigned">Digitally Signed</div>` : "";

  const bRows = formData.proposedBudgetBreakup?.length > 0
    ? formData.proposedBudgetBreakup : formData.budgetBreakup;

  const totalBudget = Number(formData.proposedEstimatedBudget ?? formData.estimatedBudget ?? 0).toFixed(2);

  // ── Description: Quill outputs HTML; render it directly, no blank lines
  const rawDesc = (formData.eventDescription || "")
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<style[^>]*>.*?<\/style>/gi, "");
  const hasDesc = rawDesc.replace(/<[^>]*>/g, "").trim().length > 0;

  // Only render the description text — no blank underlines at all
  const descArea = hasDesc
    ? `<div class="desc-filled">${rawDesc}</div>`
    : `<div style="height:8px;"></div>`; // minimal gap when empty

  // ── Requirement description table rows
  // Include normal requirements that have descriptions
  const reqFilled = formData.requirements.filter(r => r.name && r.description?.trim());

  // Also append "Any additional amenities" as the last row if it has content
  const amenityText = formData.anyAdditionalAmenities?.trim();
  if (amenityText) {
    reqFilled.push({ name: "Any additional amenities", description: amenityText });
  }

  const reqRows = Math.max(reqFilled.length, 10);

  // ── Additional amenities cell for facilities table (page 1): "Yes: <value>" or "No"
  const amenityCell = amenityText ? `Yes: ${amenityText}` : "No";

  return `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<style>

:root {
  --hi : 'Nirmala UI', 'Mangal', Arial Unicode MS, sans-serif;
  --en : 'Cambria', 'Times New Roman', Georgia, serif;
  --tn : 'Times New Roman', Georgia, serif;
  --mg : 'Mangal', 'Nirmala UI', sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family : var(--en);
  font-size   : 11pt;
  line-height : 1.5;
  color       : #000;
  background  : #fff;
}

/* ── Forced page-break (html2pdf mode:css respects this) ─────────── */
.pb { page-break-before: always; break-before: page; height: 0; display: block; }

/* ── Keep block together — never split across pages ─────────────── */
/* Used for the signatures block on page 2 so all 4 sig labels +      */
/* both sig rows + the "Page 1&2" note always land on the same page.   */
.keep {
  page-break-inside : avoid;
  break-inside      : avoid;
}

.hi  { font-family: var(--hi); }
.mg  { font-family: var(--mg); }
.tn  { font-family: var(--tn); }

/* ── Title: 11pt bold underline centre ───────────────────────────── */
.doc-title {
  font-family     : var(--tn);
  font-size       : 11pt;
  font-weight     : 700;
  text-align      : center;
  text-decoration : underline;
  margin          : 10px 0 10px;
}

/* ── Section headings ─────────────────────────────────────────────── */
.sh  { font-size: 14pt; font-weight: 700; margin: 10px 0 5px; }
.ssh { font-size: 11pt; font-weight: 700; margin: 8px 0 4px; }

/* ── Body field ───────────────────────────────────────────────────── */
.f { font-size: 11pt; margin: 3px 0; }

/* ── Underline span ───────────────────────────────────────────────── */
.ul { display: inline-block; border-bottom: 1px solid #000; min-width: 100px; vertical-align: bottom; }

/* ── Checkboxes ───────────────────────────────────────────────────── */
.cb-row { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 10px; }
.cbi    { display: inline-flex; align-items: center; gap: 4px; font-size: 11pt; white-space: nowrap; }
.cb     { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #000;
          text-align: center; line-height: 9px; font-size: 9pt; font-weight: 700; flex-shrink: 0; }
.cbon  { background: #000; color: #fff; }
.cbon::after { content: '✓'; }

/* ── Tables ───────────────────────────────────────────────────────── */
table { width: 100%; border-collapse: collapse; margin: 6px 0; }
.tbl-b th, .tbl-b td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
.tbl-b th { background: #f0f0f0; font-weight: 700; }
.tbl-f th, .tbl-f td { border: 1px solid #000; padding: 3px 6px; font-size: 10pt; }
.tbl-f th { background: #f0f0f0; font-weight: 700; }
.tbl-r th, .tbl-r td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
.tbl-r th { background: #f0f0f0; font-weight: 700; }
.tr { text-align: right; } .tc { text-align: center; } .tot { font-weight: 700; }

/* ── Description ──────────────────────────────────────────────────── */
/* Quill HTML renders as-is; ensure it wraps and is never clipped     */
.desc-filled {
  font-size   : 11pt;
  margin      : 4px 0 6px;
  text-align  : justify;
  line-height : 1.55;
  /* no max-height / overflow — let it grow naturally */
}
/* Quill wraps content in <p> tags — give them proper spacing */
.desc-filled p   { margin: 2px 0; }
.desc-filled ul, .desc-filled ol { padding-left: 18px; margin: 2px 0; }

/* desc-blank / bline removed — blank lines are no longer shown */

/* ── Signatures ───────────────────────────────────────────────────── */
/* Blank writing space above row-1 labels */
.sig-space { min-height: 52mm; }

.sig-row {
  display         : flex;
  justify-content : space-around;
  align-items     : flex-end;
  gap             : 8px;
}
.sig-box  { flex: 1; text-align: center; font-size: 9pt; min-width: 55px; }
.sig-line { border-top: 1px solid #000; padding-top: 3px; margin-top: 18px; }
.dsigned  { font-size: 7.5pt; color: #555; font-style: italic; margin-bottom: 2px; }

/* Gap between sig rows 1 and 2 */
.sig-gap { min-height: 20mm; }

/* ── Page 1&2 note ────────────────────────────────────────────────── */
.pg12 { font-size: 11pt; font-weight: 700; text-align: center; margin-top: 14px; }

/* ── Office-use section ───────────────────────────────────────────── */
.ofc-title { font-size: 14pt; font-weight: 700; text-align: center; margin: 10px 0 6px; }
.dean-space { min-height: 90mm; }
.dean-lbl   { font-size: 11pt; font-weight: 700; text-align: center; margin: 0; }

/* ── Stars / dividers ─────────────────────────────────────────────── */
.stars { font-size: 8pt; text-align: center; margin: 8px 0 4px; letter-spacing: 0.5px; }
hr { border: none; border-top: 1px solid #000; margin: 8px 0; }

/* ── Instructions ─────────────────────────────────────────────────── */
.instr-ttl  { font-size: 11pt; font-weight: 700; text-align: center; margin: 5px 0 7px; }
.instr-list { list-style: none; padding: 0; margin: 4px 0; }
.instr-list li { font-size: 11pt; text-align: justify; margin: 4px 0; line-height: 1.45; }

/* ── Additional notes ─────────────────────────────────────────────── */
.notes-hi   { font-family: var(--mg); font-size: 14pt; font-weight: 700; text-align: center; display: block; margin-top: 12px; }
.notes-en   { font-size: 11pt; font-weight: 700; text-align: center; display: block; margin-bottom: 6px; }
.notes-list { list-style: none; padding: 0; margin: 4px 0; }
.notes-list li { font-size: 12pt; text-align: justify; margin: 4px 0; line-height: 1.45; }

/* ── Requirement description table ───────────────────────────────── */
.req-ttl { font-family: var(--tn); font-size: 14pt; font-weight: 700; text-align: center; margin: 10px 0 10px; }

/* ── Note block ───────────────────────────────────────────────────── */
.note { font-size: 10pt; margin: 3px 0 5px; }

</style>
</head>
<body>

<!-- ════════════════════════════════════════════════════════════════
     PAGE 1  –  Event Details → Budget → Organizer → Requirements
════════════════════════════════════════════════════════════════ -->

<div class="doc-title">
  <span class="hi">जिमखाना कार्यक्रम अनुमति अनुरोध प्रपत्र</span>/Gymkhana Event Permission Request Form
</div>

<div class="sh"><span class="hi">आयोजन विवरण</span>/Event Details</div>

<div class="f">
  1. Event Name:&nbsp;<span class="ul" style="min-width:180px;">${formData.eventName || ''}</span>
  &nbsp;&nbsp;(Is it part of Gymkhana Calendar:&nbsp;${formData.partOfGymkhanaCalendar || 'YES / NO'})
</div>

<div class="f">
  2. Club Name:&nbsp;<span class="ul" style="min-width:220px;">${formData.clubName || ''}</span>
</div>

<div class="f">
  3. Date and Timings <strong>(in days)</strong> of the Event Proposed:&nbsp;
  <span class="ul">
    ${new Date(formData.startDate).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}
  </span>
  &nbsp;to&nbsp;
  <span class="ul">
    ${new Date(formData.endDate).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}
  </span>
</div>

<div class="f" style="margin-left:16px;">
  Venue(s):&nbsp;<span class="ul" style="min-width:160px;">${formData.eventVenue || ''}</span>
  &nbsp;<em>(Mention all venues if multiple)</em>
</div>

<div class="f" style="display:flex; align-items:baseline; flex-wrap:wrap; gap:3px;">
  4. Source of Budget/Fund:&nbsp;
  <div class="cb-row">
    ${SOURCES.map(src => {
      const isOth = src === "Others";
      const chk   = srcSelected(src);
      const label = isOth && chk ? `Others: ${formData.othersSourceOfBudget || ''}` : src;
      return checkbox(chk, label);
    }).join("")}
  </div>
</div>

${formData.fundType ? `<div class="f" style="display:flex; align-items:baseline; flex-wrap:wrap; gap:3px;">
  &nbsp;&nbsp;Fund Type:&nbsp;
  <div class="cb-row">
    ${checkbox(formData.fundType === "SAF", "SAF (Student Activity Fund)")}
    ${checkbox(formData.fundType === "HEF", "HEF (High Event Fund)")}
  </div>
</div>` : ''}

<div class="f">
  5. Estimated Budget: ₹&nbsp;<span class="ul" style="min-width:140px;">${totalBudget}&nbsp;&nbsp;(${formData.budgetAnnexureNumber})</span>
  &nbsp;(Mention Annexure No. as per the approved budget. Please provide a detailed breakup below.)
</div>

<div class="f" style="margin-top:5px;">Budget Breakup:&nbsp;<em>(As per the Budget Copy)</em></div>

<table class="tbl-b">
  <thead>
    <tr>
      <th class="tc" style="width:10%;">Sl. No</th>
      <th style="width:63%;">Expense Head</th>
      <th class="tr" style="width:27%;">Estimated Amount (₹)</th>
    </tr>
  </thead>
  <tbody>
    ${bRows.map((row, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td>${row.expenseHead || ''}</td>
      <td class="tr">${Number(row.estimatedAmount || 0).toFixed(2)}</td>
    </tr>`).join("")}
    <tr class="tot">
      <td colspan="2" class="tr">TOTAL(₹)</td>
      <td class="tr">₹&nbsp;${totalBudget}</td>
    </tr>
  </tbody>
</table>

<div class="ssh" style="margin-top:6px;"><span class="hi">आयोजक विवरण</span>/Organizer Details:</div>

<div class="f">1) Name of the Organizer and Roll no:&nbsp;
  <span class="ul" style="min-width:250px;">${formData.nameOfTheOrganizer || ''}</span>
</div>
<div class="f">2) Designation:&nbsp;
  <span class="ul" style="min-width:260px;">${formData.designation || ''}</span>
</div>
<div class="f">3) Email:&nbsp;
  <span class="ul" style="min-width:270px;">${formData.email || ''}</span>
</div>
<div class="f">4) Phone No.:&nbsp;
  <span class="ul" style="min-width:220px;">${formData.phoneNumber || ''}</span>
</div>

<div class="ssh" style="margin-top:6px;"><span class="hi">आवश्यकताएं</span>/Requirements:</div>

<div class="note">
  <strong>Note:</strong><br>
  If <em>"Yes"</em> is selected for any facility, please provide a brief description of the
  requirement on a <strong>separate sheet.</strong>
</div>

<table class="tbl-f">
  <thead>
    <tr>
      <th style="width:55%;">Facility</th>
      <th style="width:45%;">Required?</th>
    </tr>
  </thead>
  <tbody>
    ${FACILITIES.map(fac => {
      const yes = formData.requirements.some(r => typeof r === "string" ? r === fac : r.name === fac);
      /* Default is "No" — only show "Yes" when the facility is ticked */
      return `<tr><td>${fac}</td><td>${yes ? "Yes" : "No"}</td></tr>`;
    }).join("")}
    <tr>
      <td>Any additional amenities</td>
      <!-- "No" by default; "Yes: <value>" when amenity text is provided -->
      <td>${amenityCell}</td>
    </tr>
  </tbody>
</table>


<!-- ════════════════════════════════════════════════════════════════
     PAGE 2  –  Brief Description → [keep-together block]
     FORCED PAGE BREAK before this section
════════════════════════════════════════════════════════════════ -->
<div class="pb"></div>

<!-- Brief description: flows freely — can push keep-together to next page -->
<div class="f"><strong>Brief Description of the Event:</strong></div>
${descArea}

<!--
  ┌─────────────────────────────────────────────────────────────────┐
  │  KEEP-TOGETHER BLOCK                                            │
  │  Everything from "Expected Participants" through the two        │
  │  signature rows and the "Page 1&2" footer note is wrapped in    │
  │  a single div with page-break-inside:avoid so it never splits   │
  │  — even when the description above is very long.                │
  └─────────────────────────────────────────────────────────────────┘
-->
<div class="keep">

  <!-- Expected participants -->
  <div class="f" style="text-align:justify; margin-top:6px;">
    <strong>Expected Number of Participants:&nbsp;&nbsp;External:&nbsp;</strong>
    <span class="ul" style="min-width:90px;">${formData.externalParticipants || 0}</span>
    &nbsp;&nbsp;&nbsp;<strong>Internal:&nbsp;</strong>
    <span class="ul" style="min-width:80px;">${formData.internalParticipants || 0}</span>
  </div>

  <!-- Declaration -->
  <div class="f" style="text-align:justify; margin-top:8px;">
    I,&nbsp;<span class="ul" style="min-width:170px;">${formData.nameOfTheOrganizer || ''}</span>,
    &nbsp;(Designation:&nbsp;<span class="ul" style="min-width:130px;">${formData.designation || ''}</span>),
    &nbsp;Will take responsibility to organize and conduct the event to the best of my ability and as per the institute rules.
  </div>

  <!-- Bold italic note -->
  <div class="f" style="text-align:justify; font-style:italic; font-weight:700; margin-top:6px;">
    (Please read the instructions overleaf. Please submit this form to the student welfare Office
    at least 2&nbsp;weeks prior to the proposed event date. Seeking the approval from the competent authority.)
  </div>

  <!-- Blank writing space above sig-row 1 -->
  <div class="sig-space"></div>

  <!-- Sig row 1: Club Sec | Gen Sec | Treasurer | Vice President -->
  <div class="sig-row">
    <div class="sig-box">
      ${signed('club-secretary')}
      <div class="sig-line"><span class="hi">क्लब सचिव</span>/<br>Club Secretary</div>
    </div>
    <div class="sig-box">
      ${signed('general-secretary')}
      <div class="sig-line"><span class="hi">महासचिव</span>/<br>General Secretary</div>
    </div>
    <div class="sig-box">
      ${signed('treasurer')}
      <div class="sig-line"><span class="hi">कोषाध्यक्ष</span>/<br>Treasurer</div>
    </div>
    <div class="sig-box">
      ${signed('president')}
      <div class="sig-line"><span class="hi">उपाध्यक्ष</span>/<br>Vice President</div>
    </div>
  </div>

  <!-- Gap between sig rows -->
  <div class="sig-gap"></div>

  <!-- Sig row 2: Faculty in Charge | Associate Dean -->
  <div class="sig-row" style="justify-content:space-between; padding:0 10px;">
    <div class="sig-box" style="flex:0 0 auto; text-align:left; max-width:200px;">
      ${signed('faculty-in-charge')}
      <div class="sig-line" style="text-align:left;">
        <span class="hi">प्रभारी संकाय</span>&nbsp;/Faculty in Charge
      </div>
    </div>
    <div class="sig-box" style="flex:0 0 auto; text-align:right; max-width:240px;">
      ${signed('associate-dean')}
      <div class="sig-line" style="text-align:right;">
        <span class="hi">एसोसिएट डीन (जीमखाना/&nbsp;एच एंड एम)</span>&nbsp;/<br>
        <span class="hi">सामाजिक सांस्कृतिक</span><br>
        Associate Dean (Gymkhana/H&amp;M/Socio-Cult)
      </div>
    </div>
  </div>

  <!-- "Page 1&2" note -->
  <div class="pg12">Page 1&amp;2 (to be completed by the applicant/student)</div>

</div><!-- /keep -->


<!-- ════════════════════════════════════════════════════════════════
     PAGE 3  –  For Office Use / Dean → Instructions (flows to pg 4)
     FORCED PAGE BREAK
════════════════════════════════════════════════════════════════ -->
<div class="pb"></div>

<div class="ofc-title">
  <span class="hi">कार्यालय उपयोग के लिए</span>&nbsp;/For Office Use:<br>
  <span class="hi">प्रशासनिक अनुमोदन</span>/Administrative&nbsp;approval/<span class="hi">बजट&nbsp;अनुमोदन</span>/Budget&nbsp;Approval
</div>

<div class="dean-space"></div>

<div class="dean-lbl">
  ${signed('dean')}
  <span class="hi">डीन</span>&nbsp;/Dean<br>
  <span class="hi">छात्र कल्याण</span>&nbsp;/Student Welfare
</div>

<div class="stars">************************************************************************************</div>

<div class="instr-ttl">
  <span class="mg">छात्रों को निर्देश</span>&nbsp;/&nbsp;Instructions to the Students:
</div>

<ol class="instr-list">
  ${INSTRS.map((ins, i) => `
    <li style="${ins.b ? 'font-weight:700;' : ''}">${i + 1}.&nbsp;${ins.t}</li>`).join("")}
</ol>

<!-- Additional Notes flows naturally after instructions (page 4 area) -->
<span class="notes-hi"><span class="mg">अतिरिक्त नोट्स और विशेष निर्देश</span>/</span>
<span class="notes-en">Additional Notes &amp; Special Instructions:</span>

<ol class="notes-list">
  ${NOTES.map((n, i) => {
    const body = n.html ? n.html : n.t;
    return `<li>${i + 1}.&nbsp;${body}</li>`;
  }).join("")}
</ol>


<!-- ════════════════════════════════════════════════════════════════
     PAGE 5  –  Requirement description table
     FORCED PAGE BREAK — always on its own page
════════════════════════════════════════════════════════════════ -->
<div class="pb"></div>

<div class="req-ttl">A brief description of a requirement that has been ticked off in a form</div>

<table class="tbl-r" style="margin-top:10px;">
  <thead>
    <tr>
      <th class="tc" style="width:10%;">Sl<br>No</th>
      <th style="width:28%;">Requirement/Facility</th>
      <th class="tc" style="width:62%;">Brief</th>
    </tr>
  </thead>
  <tbody>
    ${Array.from({ length: reqRows }, (_, idx) => {
      const req = reqFilled[idx];
      return `<tr style="height:28px;">
        <td class="tc">${idx + 1}</td>
        <td>${req ? req.name        : ''}</td>
        <td>${req ? req.description : ''}</td>
      </tr>`;
    }).join("")}
  </tbody>
</table>

</body>
</html>`;
};