import html2pdf from "html2pdf.js";

/* Helper to convert Blob -> data URL (base64) */
const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

/**
 * HTML-based PDF generator:
 * - Uses html2pdf.js for proper Hindi text rendering
 * - Handles complex Devanagari scripts correctly
 * - Creates a temporary HTML element that gets converted to PDF
 */
export const generatePDF = async (formData = {}, headerImageURL = "") => {
  try {
    // Safe defaults
    formData.requirements = Array.isArray(formData.requirements)
      ? formData.requirements
      : [];
    formData.budgetBreakup = Array.isArray(formData.budgetBreakup)
      ? formData.budgetBreakup
      : [];
    formData.proposedBudgetBreakup = Array.isArray(formData.proposedBudgetBreakup)
      ? formData.proposedBudgetBreakup
      : [];

    // Try to fetch header image (optional). If it fails, proceed without it.
    let headerDataUrl = null;
    if (headerImageURL) {
      try {
        const res = await fetch(headerImageURL, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const blob = await res.blob();
        headerDataUrl = await blobToDataURL(blob);
      } catch (err) {
        console.warn("Header image fetch failed — continuing without header image:", err);
      }
    }

    // Create HTML content for the PDF
    const htmlContent = createHTMLContent(formData, headerDataUrl);

    // Configure html2pdf options
    const opt = {
      margin: [5, 5, 5, 5],
      filename: 'gymkhana_event_form.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Generate PDF using html2pdf
    const pdfBlob = await html2pdf()
      .set(opt)
      .from(htmlContent)
      .outputPdf('blob')
      .then(blob => blob);

    const blobUrl = URL.createObjectURL(pdfBlob);
    const dataUrl = await blobToDataURL(pdfBlob);

    return { blob: pdfBlob, blobUrl, dataUrl };
  } catch (err) {
    console.error("generatePDF failed:", err);
    throw err; // rethrow so caller can handle
  }
};

/**
 * Create HTML content for PDF generation with proper Hindi text support
 */
const createHTMLContent = (formData, headerDataUrl) => {
  const sources = ["Sports Budget", "Cultural Budget", "Technical Budget", "Others"];
  const facilities = [
    "Security",
    "Transport",
    "IPS Related",
    "Housekeeping",
    "Refreshment",
    "Ambulance",
    "Networking",
  ];
  
  const instructions = [
    "<strong>For reserving classrooms in CLT please contact the Academics Office with approval form.</strong>",
    "For any Audio/Visual assistance please contact the Academic Office/Classroom maintenance staff.",
    "For reserving rooms for external participants in Hostel blocks please contact SW Office.",
    "For Network Issues/requirements please contact the CCS Office with this prior approval.",
    "Event organizer team is requested to provide the Visitors ID to the all-external participants.",
    "All the events to end by 11PM as notified in Hostels Rules and Regulations.",
    "<strong>All the Accounts need to settle within 2 weeks of the event conclusion, which will be responsibility of concerned GS, Treasurer and President.</strong>",
    "A report is to be submitted to SW Office by the organizer after the conclusion of the event within 2 weeks.",
    "If the external experts/dignitaries are invited, please mention the details.",
    "<strong>Please ensure all invoices submitted to the SW office are GST-compliant. Invoices must include GSTIN, invoice number and date, supplier and recipient details, description of goods/services, tax breakdown, total amount (in figures and words), place of supply, seal and signature, and vendor account details.</strong>",
    "<strong>To avoid delays, ensure invoices are accurate and meet all GST requirements. Additionally, anyone receiving advances must submit a settlement bill with any unspent balance within 15 days of withdrawal.</strong>"
  ];

  const additionalNotes = [
    "Ensure all relevant permissions from security, transport, and other logistics are coordinated well in advance.",
    "If media coverage is expected, inform the Public Relations/Media Cell of appropriate details through the SW office",
    "Obtain all necessary approval if any cash awards, gifts, or mementos are to be distributed. ",
    "Submit soft copies of event posters/flyers for brand review before circulation to SW office.",
    "If the event involves competitions, clearly outline the rules and evaluation criteria in advance. <strong>The result sheet must also be submitted to the office.</strong> Additionally, students must ensure <strong>that all bills/invoices are accurate and submit them along with their bank details for reimbursement processing.</strong>",
    "Coordinate with the Institute Wellness Center if an ambulance or medical support is required.",
    "Maintain proper documentation of expenses, including bills, receipts, and vendor invoices.",
    "Clearly demarcate and manage entry/exit points if external attendees are expected.",
    "If the event spans multiple days, ensure a daily schedule is submitted for review.",
    "Use sustainable practices where possible (e.g., avoid plastic, use digital communication).",
    "Any loss or damage to institute property occurring during the event will be the sole responsibility of the General Secretary and the Event Organizer.",
    "<strong>For stage play activities such as dramas, skits, or scripts, prior approval must be obtained from the concerned authorities</strong>, including club representatives and the Associate Dean. All requests should be submitted well in advance for approval by the competent authority.",
   ];

  return `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Devanagari', 'Roboto', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: white;
    }
    
    .page {
      width: 200mm;
      min-height: 287mm;
      padding: 10mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .header img {
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }
    
    .title {
      font-size: 11pt;
      font-weight: 700;
      text-align: center;
      margin: 15px 0;
      color: #000;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      margin: 15px 0 8px 0;
      color: #000;
    }
    
    .field {
      margin: 6px 0;
      font-size: 11pt;
    }
    
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: 8px 0;
      align-items: center;
    }
    
    .checkbox-item {
      display: inline-flex;
      align-items: center;
      margin-right: 10px;
      margin-bottom: 5px;
      white-space: nowrap;
    }
    
    .checkbox {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #000;
      margin-right: 6px;
      text-align: center;
      line-height: 13px;
      font-size: 11pt;
      font-weight: bold;
      flex-shrink: 0;
    }
    
    .checked {
      background: #000;
      color: #fff;
    }
    
    .checkbox-label {
      font-size: 10pt;
      line-height: 1.2;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }
    
    table th,
    table td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
    }
    
    table th {
      background: #f0f0f0;
      font-weight: 600;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .signature-row {
      display: flex;
      justify-content: space-around;
      margin: 25px 0;
      flex-wrap: wrap;
    }
    
    .signature-box {
      text-align: center;
      min-width: 80px;
      font-size: 9pt;
      margin: 5px;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 40px;
      padding-top: 5px;
    }
    
    .footer-note {
      font-size: 8pt;
      color: #666;
      margin-top: 20px;
      text-align: center;
    }
    
    .instructions-list,
    .notes-list {
      margin: 10px 0;
      padding-left: 0;
      list-style: none;
    }
    
    .instructions-list li,
    .notes-list li {
      margin: 6px 0;
      font-size: 9pt;
      line-height: 1.3;
    }
    
    .description-box {
      padding: 10px;
      margin: 10px 0;
      min-height: 60px;
      font-size: 10pt;
    }
    
    hr {
      border: none;
      border-top: 1px solid #000;
      margin: 15px 0;
    }
    
    .approval-section {
      margin: 30px 0;
      text-align: center;
    }

    .page-break {
  page-break-before: always; /* Older browsers */
  break-before: page;        /* Modern browsers */
}
    
    .approval-box {
      display: inline-block;
      text-align: center;
      margin: 20px;
    }
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="page">
    ${headerDataUrl ? `
    <div class="header">
      <img src="${headerDataUrl}" alt="Header" />
    </div>
    ` : ''}
    
    <div class="title" style="text-decoration: underline;">
      जिमखाना कार्यक्रम अनुमति अनुरोध प्रपत्र/Gymkhana Event Permission Request Form
    </div>
    
    <div class="section-title">आयोजन विवरण/Event Details:</div>
    
    <div class="field">
      1) Event Name: ${formData.eventName || ''} 
      (Is it part of Gymkhana Calendar: ${formData.partOfGymkhanaCalendar || 'NO'})
    </div>
    
    <div class="field">
      2) Club Name: ${formData.clubName || ''}
    </div>
    
    <div class="field">
      3) Date/Duration (in days) of the Event Proposed: ${formData.startDate.split('T')[0] || ''} to ${formData.endDate.split('T')[0] || ''}
    </div>
    
    <div class="field" style="margin-left: 20px;">
      Venue(s): ${formData.eventVenue || ''}
    </div>
    <div style="display: flex">
    <div class="field">
      4) Source of Budget/Fund:&nbsp;&nbsp;
    </div>
    <div class="checkbox-group">
      ${sources.map(src => {
        const firstWord = src.split(' ')[0];
        const isChecked = formData.sourceOfBudget && (
          formData.sourceOfBudget === src || 
          formData.sourceOfBudget === firstWord ||
          formData.sourceOfBudget.startsWith(firstWord)
        );
        return `
        <div class="checkbox-item">
          <span class="checkbox ${isChecked ? 'checked' : ''}">
            ${isChecked ? '✓' : ''}
          </span>
          <span class="checkbox-label">${src === 'Others' && isChecked ? `Others: ${formData.othersSourceOfBudget || ''}` : src}</span>
        </div>
        `;
      }).join('')}
    </div></div>
    
    <div class="field">
      5) Estimated Budget: ₹ ${Number(formData.estimatedBudget || 0).toFixed(2)} 
      (Please provide a breakup below)
    </div>
    
    <div style="margin-top: 10px;">
      Budget Breakup: (As per the Budget Copy)
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">Sl.No</th>
          <th style="width: 60%;">Expense Head</th>
          <th style="width: 30%;" class="text-right">Estimated Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${(formData.proposedBudgetBreakup && formData.proposedBudgetBreakup.length > 0 ? formData.proposedBudgetBreakup:formData.budgetBreakup).map((item, i)=> `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td>${item.expenseHead || ''}</td>
            <td class="text-right">${Number(item.estimatedAmount || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr style="font-weight: 600;">
          <td colspan="2" class="text-right">TOTAL (₹)</td>
          <td class="text-right">₹ ${Number(formData.budgetBreakup && formData.budgetBreakup.length > 0 ? formData.estimatedBudget:formData.estimatedBudget).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="section-title" style="font-size: 11pt">आयोजक विवरण / Organizer Details:</div>
    
    <div class="field">
      1) Name of the Organizer: ${formData.nameOfTheOrganizer || ''}
    </div>
    
    <div class="field">
      2) Designation: ${formData.designation || ''}
    </div>
    
    <div class="field">
      3) Email: ${formData.email || ''}
    </div>
    
    <div class="field">
      4) Phone No.: ${formData.phoneNumber || ''}
    </div>
    
    <div style="font-size: 11pt; margin-top: 10px;">आवश्यकताएं / Requirements:</div>
    
    <table style="margin-top: 8px;">
      <thead>
        <tr>
          <th style="width: 50%;">Facility</th>
          <th style="width: 50%;">Required</th>
        </tr>
      </thead>
      <tbody>
        ${facilities.map(facility => {
          const isChecked = formData.requirements.includes(facility);
          return `
            <tr>
              <td style="width: 50%; padding: 6px; font-weight: 500;">${facility}</td>
              <td style="width: 50%; padding: 6px;">${isChecked ? 'Yes' : 'No'}</td>
            </tr>
          `;
        }).join('')}
        <tr>
          <td style="width: 50%; padding: 6px; font-weight: 500;">Any additional amenities</td>
          <td style="width: 50%; padding: 6px;">${formData.anyAdditionalAmenities || 'No'}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="margin-top: 15px;">
      <strong>Brief Description of the Event:</strong>
      <div class="description-box">
        ${formData.eventDescription || ''}
      </div>
    </div>
    
    <div class="field">
      <strong>Expected Number of Participants:</strong> 
      <strong>External:</strong> ${formData.externalParticipants || 0}  <strong>Internal:</strong> ${formData.internalParticipants || 0}
    </div>
    
    <div class="field" style="margin-top: 15px;">
      I, <strong>${formData.nameOfTheOrganizer || ''}</strong>, (Designation: <strong>${formData.designation || ''}</strong>), 
      will take responsibility to organize and conduct the event to the best of my ability and as per the institute rules.</br></br>
      <strong>(Please read the instructions overleaf. Please submit this form to the student welfare Office at least 2 weeks prior to the proposed event date. Seeking the approval from the competent authority.)</strong>
    </div>
    
    <div class="signature-row">
      <div class="signature-box">
      ${formData.approvals?.find(a => a.role === 'club-secretary')?.status === 'Approved' 
            ? '<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2px;">Digitally Signed</div>' 
            : ''}
        <div style="border-top: 1px solid #000; width: 150px; margin: 20px auto 5px auto;">
          
        </div>
        <div>क्लब सचिव / Club Secretary</div>
      </div>
      <div class="signature-box">
      ${formData.approvals?.find(a => a.role === 'general-secretary')?.status === 'Approved' 
            ? '<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2px;">Digitally Signed</div>' 
            : ''}
        <div style="border-top: 1px solid #000; width: 150px; margin: 20px auto 5px auto;">
        </div>
        <div>महासचिव / General Secretary</div>
      </div>
      <div class="signature-box">
      ${formData.approvals?.find(a => a.role === 'treasurer')?.status === 'Approved' 
            ? '<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2px;">Digitally Signed</div>' 
            : ''}
        <div style="border-top: 1px solid #000; width: 150px; margin: 20px auto 5px auto;">
        </div>
        <div>कोषाध्यक्ष / Treasurer</div>
      </div>
      <div class="signature-box">
      ${formData.approvals?.find(a => a.role === 'president')?.status === 'Approved' 
            ? '<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2px;">Digitally Signed</div>' 
            : ''}
        <div style="border-top: 1px solid #000; width: 150px; margin: 20px auto 5px auto;">
        </div>
        <div>अध्यक्ष / President</div>
      </div>
    </div>
    
    <div class="signature-row" style="margin-top: 30px;">
      <div class="signature-box">
      ${formData.approvals?.find(a => a.role === 'ARSW')?.status === 'Approved' 
            ? '<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2px;">Digitally Signed</div>' 
            : ''}
        <div style="border-top: 1px solid #000; width: 150px; margin: 20px auto 5px auto;">
        </div>
        <div>सहायक कुलसचिव छात्र कल्याण / ARSW</div>
      </div>
      <div class="signature-box">
      ${formData.approvals?.find(a => a.role === 'associate-dean')?.status === 'Approved' 
            ? '<div style="font-size: 8pt; color: #666; font-style: italic; margin-top: 2px;">Digitally Signed</div>' 
            : ''}
        <div style="border-top: 1px solid #000; width: 150px; margin: 20px auto 5px auto;">
        </div>
        <div>एसोसिएट डीन / Associate Dean</div>
      </div>
    </div>
    <div class="footer-note">
      Page 1 & 2 (to be completed by the applicant/student)
    </div>
  </div>
  
  <!-- PAGE 2 -->
  <div class="page">
    ${headerDataUrl ? `
    <div class="header">
      <img src="${headerDataUrl}" alt="Header" />
    </div>
    ` : ''}
    
    <div class="title" style="margin-top: 40px;">
      कार्यालय उपयोग के लिए / For Office Use:<br/>
      प्रशासनिक अनुमोदन / Administrative Approval / बजट अनुमोदन / Budget Approval
    </div>
    
    <div class="approval-section">
      <div class="approval-box">
      ${formData.approvals?.find(a => a.role === 'dean')?.status === 'Approved' 
            ? '<div style="font-size: 8pt; color: #666; font-style: italic; margin-bottom: 0px;">Digitally Signed</div>' 
            : ''}
        <div class="signature-line" style="width: 300px;">
          <strong>डीन / Dean<br/>
          छात्र कल्याण / Student Welfare</strong>
        </div>
      </div>
    </div>
    <hr/>
    
    <div class="section-title" style="text-align: center; font-size: 11pt;">छात्रों को निर्देश / Instructions to the Students:</div>
    
    <ol class="instructions-list">
      ${instructions.map((inst, i) => `
        <li><strong>${i + 1}.</strong> ${inst}</li>
      `).join('')}
    </ol>
    <div class="page-break"></div>
    <div class="section-title" style="margin-top: 20px; text-align: center;">
      अतिरिक्त नोट्स और विशेष निर्देश /<br/> Additional Notes & Special Instructions:
    </div>
    
    <ol class="notes-list">
      ${additionalNotes.map((note, i) => `
        <li><strong>${i + 1}.</strong> ${note}</li>
      `).join('')}
    </ol>
  </div>
</body>
</html>
  `;
};
