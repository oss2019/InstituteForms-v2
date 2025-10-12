import { jsPDF } from "jspdf";
import { notoSansDevanagariBase64 } from './fonts/notoFont.js'; // Import the Base64 string from the new file

/**
 * Generate a PDF using the provided form data and header image URL.
 * @param {Object} formData - The form data to populate the PDF.
 * @param {string} headerImageURL - The URL or path of the header image.
 */
export const generatePDF = async (formData, headerImageURL) => {
  const doc = new jsPDF();
  
  // Register the custom font directly from the Base64 string
  doc.addFileToVFS('NotoSansDevanagari-normal.ttf', notoSansDevanagariBase64);
  doc.addFont('NotoSansDevanagari-normal.ttf', 'NotoSansDevanagari', 'normal');
  
  // Set the new font for the entire document
  doc.setFont('NotoSansDevanagari');

  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 40;
  const headerWidth = 180;

  const imgData = await fetch(headerImageURL).then((res) => res.blob());
  const reader = new FileReader();
  reader.readAsDataURL(imgData);

  reader.onloadend = () => {
    const base64data = reader.result;
    const xPosition = (pageWidth - headerWidth) / 2;
    const marginLeft = 10;

    // --- PAGE 1 ---
    doc.addImage(base64data, "JPEG", xPosition, 0, headerWidth, headerHeight);

    doc.setFontSize(14).setFont('NotoSansDevanagari', 'normal');
    doc.text("जिमखाना कार्यक्रम अनुमति अनुरोध प्रपत्र / Gymkhana Event Permission Request Form", 105, 45, { align: "center" });
    
    doc.setFontSize(11).setFont('NotoSansDevanagari', 'normal');
    doc.text("आयोजन विवरण / Event Details:", marginLeft, 55);

    let currentY = 60;
    doc.text(`1) Event Name: ${formData.eventName}`, marginLeft, currentY); currentY += 7;
    doc.text(`Is it part of Gymkhana Calendar?: ${formData.partOfGymkhanaCalendar}`, marginLeft, currentY); currentY += 7;
    doc.text(`2) Club Name: ${formData.clubName}`, marginLeft, currentY); currentY += 7;
    doc.text(`3) Date/Duration of the Event proposed: ${formData.startDate} to ${formData.endDate}`, marginLeft, currentY); currentY += 7;
    doc.text(`4) Venue(s): ${formData.eventVenue}`, marginLeft, currentY); currentY += 7;
    doc.text(`5) Source of Budget/Fund: ${formData.sourceOfBudget === 'Others' ? formData.othersSourceOfBudget : formData.sourceOfBudget}`, marginLeft, currentY); currentY += 7;
    doc.text(`6) Estimated Budget: ₹ ${Number(formData.estimatedBudget).toFixed(2)}`, marginLeft, currentY); currentY += 7;

    // --- Budget Breakup Table ---
    currentY += 5;
    doc.text("Budget Breakup:", marginLeft, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.text("Sl.No", 15, currentY);
    doc.text("Expense Head", 40, currentY);
    doc.text("Estimated Amount (₹)", 195, currentY, { align: 'right' });
    currentY += 2;
    doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
    currentY += 5;

    // formData.budgetBreakup.forEach((item, index) => {
    //     const expenseLines = doc.splitTextToSize(item.expenseHead || "N/A", 120);
    //     const amount = Number(item.estimatedAmount || 0).toFixed(2);
    //     const textHeight = expenseLines.length * 5;

    //     doc.text(`${index + 1}.`, 15, currentY);
    //     doc.text(expenseLines, 40, currentY);
    //     doc.text(amount, 195, currentY, { align: 'right' });
        
    //     currentY += textHeight + 2;
    // });

    doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
    currentY += 5;
    doc.text("TOTAL", 40, currentY);
    doc.text(`₹ ${Number(formData.estimatedBudget).toFixed(2)}`, 195, currentY, { align: 'right' });
    currentY += 10;

    const col1X = 15;
    const col2X = pageWidth / 2 + 5;
    const startYColumns = currentY;

    doc.setFontSize(11);
    doc.text("आयोजक विवरण / Organizer Details:", col1X, startYColumns);
    doc.text(`1) Name: ${formData.nameOfTheOrganizer}`, col1X, startYColumns + 7);
    doc.text(`2) Designation: ${formData.designation}`, col1X, startYColumns + 12);
    doc.text(`3) Email: ${formData.email}`, col1X, startYColumns + 17);
    doc.text(`4) Phone No.: ${formData.phoneNumber}`, col1X, startYColumns + 22);

    doc.text("आवश्यकताएं / Requirements:", col2X, startYColumns);
    const allRequirements = ["Security", "Transport", "IPS Related", "Housekeeping", "Refreshment", "Ambulance", "Networking"];
    let reqY = startYColumns + 7;
    // allRequirements.forEach((req) => {
    //     const value = formData.requirements.includes(req) ? "Yes" : "No";
    //     doc.text(`${req}: ${value}`, col2X, reqY);
    //     reqY += 5;
    // });
    doc.text(`Any additional amenities: ${formData.anyAdditionalAmenities || "No"}`, col2X, reqY);
    
    currentY = reqY + 10;
    
    doc.text("Brief Description of the Event:", marginLeft, currentY);
    currentY += 5;
    // doc.text(formData.eventDescription, marginLeft, currentY, { maxWidth: pageWidth - 20 });
    currentY += 21;

    doc.text(`Expected Number of Participants: (External: ${formData.externalParticipants} Internal: ${formData.internalParticipants})`, marginLeft, currentY);
    currentY += 7;
    doc.text(`If external participants are invited, list of collaborating organizations: ${formData.listOfCollaboratingOrganizations}`, marginLeft, currentY);
    currentY += 7;

    doc.text(`I, ${formData.nameOfTheOrganizer}, (Designation: ${formData.designation}), will take responsibility to organize and conduct the event to the best of my ability and as per the institute rules.`, marginLeft, currentY, { maxWidth: pageWidth - 20 });
    currentY += 10;

    currentY += 10;
    const sigX1 = 20, sigX2 = 70, sigX3 = 120, sigX4 = 170;
    doc.setFontSize(10);
    doc.text("क्लब सचिव / Club Secretary", sigX1, currentY, {align: "center"});
    doc.text("महासचिव / General Secretary", sigX2, currentY, {align: "center"});
    doc.text("कोषाध्यक्ष / Treasurer", sigX3, currentY, {align: "center"});
    doc.text("अध्यक्ष / President", sigX4, currentY, {align: "center"});
    currentY += 20;
    doc.text("प्रभारी संकाय / Faculty in Charge", 55, currentY, {align: "center"});
    doc.text("एसोसिएट डीन / Associate Dean", 155, currentY, {align: "center"});

    doc.setFontSize(7).text("Page-1 (to be completed by the applicant/student)", marginLeft, 295);

    // --- PAGE 2 ---
    doc.addPage();
    doc.addImage(base64data, "JPEG", xPosition, 0, headerWidth, headerHeight);

    currentY = 50;
    doc.setFontSize(12);
    doc.text("कार्यालय उपयोग के लिए / For Office Use: प्रशासनिक अनुमोदन / Administrative approval/ बजट अनुमोदन / Budget Approval", pageWidth / 2, currentY, { align: "center" });
    currentY += 70;
    doc.text("डीन / Dean", pageWidth/2 + 50, currentY, {align: "center"});
    doc.text("छात्र कल्याण / Student Welfare", pageWidth/2 + 50, currentY + 5, {align: "center"});

    doc.line(marginLeft, currentY + 15, pageWidth - marginLeft, currentY + 15);
    currentY += 25;
    
    doc.setFontSize(12).text("छात्रों को निर्देश / Instructions to the Students:", marginLeft, currentY);
    currentY += 7;

    doc.setFontSize(10);
    const instructions = [
      "For reserving classrooms in CLT please contact the Academics Office with the approval form.",
      "For any Audio/Visual assistance please contact the Academic Office/Classroom maintenance staff.",
      "For reserving rooms for external participants in Hostel blocks please contact SW Office.",
      "For Network Issues/requirements please contact the CCS Office with this prior approval.",
      "Event organizer team is requested to provide the Visitors ID to the all-external participants.",
      "All the events are to end by 11PM as notified in Hostels Rules and Regulations.",
      "All the Accounts need to be settled within 2 weeks of the event conclusion, which will be the responsibility of concerned GS, Treasurer, and President.",
      "A report is to be submitted to the SW Office by the organizer after the conclusion of the event within 2 weeks.",
      "If the external experts/dignitaries are invited, please mention the details.",
      "Please ensure all invoices submitted to the SW office are GST-compliant. Invoices must include GSTIN, invoice number and date, supplier and recipient details, tax breakdown, total amount, place of supply, seal, and signature.",
      "To avoid delays, ensure invoices are accurate and meet all GST requirements. Anyone receiving advances must submit a settlement bill with any unspent balance within 15 days of withdrawal."
    ];
    
    instructions.forEach((instruction, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${instruction}`, pageWidth - 30);
        doc.text(lines, marginLeft + 5, currentY);
        currentY += (lines.length * 5) + 2;
    });

    currentY += 5;
    doc.setFontSize(12).text("अतिरिक्त नोट्स और विशेष निर्देश / Additional Notes & Special Instructions:", marginLeft, currentY);
    currentY += 7;
    doc.setFontSize(10);
    
    const additionalInstructions = [
        "Ensure all relevant permissions from security, transport, and other logistics are coordinated well in advance.",
        "If media coverage is expected, inform the Public Relations/Media Cell through the SW office.",
        "Obtain all necessary approval if any cash awards, gifts, or mementos are to be distributed.",
        "Submit soft copies of event posters/flyers for brand review to SW office before circulation.",
        "If the event involves competitions, clearly outline the rules and evaluation criteria in advance. The result sheet must also be submitted.",
        "Coordinate with the Institute Wellness Center if an ambulance or medical support is required.",
        "Maintain proper documentation of expenses, including bills, receipts, and vendor invoices.",
        "Clearly demarcate and manage entry/exit points if external attendees are expected.",
        "If the event spans multiple days, ensure a daily schedule is submitted for review.",
        "Use sustainable practices where possible (e.g., avoid plastic, use digital communication).",
        "Any loss or damage to institute property during the event will be the sole responsibility of the General Secretary and the Event Organizer.",
        "For stage play activities (dramas, skits), prior script approval must be obtained from the concerned authorities."
    ];
    
    additionalInstructions.forEach((instruction, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${instruction}`, pageWidth - 30);
        doc.text(lines, marginLeft + 5, currentY);
        currentY += (lines.length * 5) + 2;
        if (currentY > 280) {
            doc.addPage();
            currentY = 20;
        }
    });

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const previewElement = document.getElementById("pdf-preview");
    if (previewElement) previewElement.src = pdfUrl;
  };
};