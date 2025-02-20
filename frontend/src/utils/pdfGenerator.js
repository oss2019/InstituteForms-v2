import { jsPDF } from "jspdf";

/**
 * Generate a PDF using the provided form data and header image URL.
 * @param {Object} formData - The form data to populate the PDF.
 * @param {string} headerImageURL - The URL or path of the header image.
 */
export const generatePDF = async (formData, headerImageURL) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 40; // Adjust as needed
  const headerWidth = 180; // Adjust as needed

  // Load the header image
  const imgData = await fetch(headerImageURL).then((res) => res.blob());
  const reader = new FileReader();

  reader.readAsDataURL(imgData);

  reader.onloadend = () => {
    const base64data = reader.result;

    // Calculate centered position for the header image
    const xPosition = (pageWidth - headerWidth) / 2;

    // Add Header to Page 1
    doc.addImage(base64data, "JPEG", xPosition, 0, headerWidth, headerHeight);

     // Content for Page 1
     doc.setFontSize(14).setFont(undefined, 'bold')
     doc.text("Gymkhana Event Permission Request Form", 105, 45, { align: "center" });
     doc.setFontSize(11);
     doc.text("Event Details:", 10, 55);

     // currentY is the Y - position of the next line to print
     let currentY = 60;
     doc.setFont(undefined, 'normal');
     doc.text(`1) Event Name: ${formData.eventName}`, 10, currentY); currentY += 7;
     doc.text(`Is it part of Gymkhana Calendar?: ${formData.partOfGymkhanaCalendar}`, 10, currentY); currentY += 7;
     doc.text(`2) Club Name: ${formData.clubName}`, 10, currentY); currentY += 7;
     doc.text(`3) Date/Duration (in days) of the Event proposed: ${formData.startDate} to ${formData.endDate}`, 10, currentY); currentY += 7;
     doc.text(`4) Venue: (Mention all in case of multiple venues): ${formData.eventVenue}`, 10, currentY); currentY += 7;
     doc.text(`5) Source of Budget/Fund: ${formData.sourceOfBudget}`, 10, currentY); currentY += 7;
//       doc.text("   1) Sports Budget   2) Cultural Budget   3) Technical Budget   4) Others", 10, 120);
     doc.text(`6) Estimated Budget: ${formData.estimatedBudget}`, 10, currentY); currentY += 7;


     // Content for the Two Columns Layout (all in Bold)
     doc.setFont(undefined, 'bold')
     const marginLeftCol1 = 15;
     const marginLeftCol2 = pageWidth / 2 + 5; // Second column starting position

     // Column 1: Organizer Details
     currentY += 6;
     doc.text("Organizer Details:", marginLeftCol1, currentY); currentY += 7;
     doc.text(`1) Name of the Organizer: ${formData.nameOfTheOrganizer}`, marginLeftCol1, currentY); currentY += 5;
     doc.text(`2) Designation: ${formData.designation}`, marginLeftCol1, currentY); currentY += 5;
     doc.text(`3) Email: ${formData.email}`, marginLeftCol1, currentY); currentY += 5;
     doc.text(`4) Phone No.: ${formData.phoneNumber}`, marginLeftCol1, currentY);

     // Column 2: Requirements
     currentY -= 22;
     doc.text("Requirements:", marginLeftCol2, currentY); currentY += 7;
     const allRequirements = ["Security", "Transport", "IPS Related", "Housekeeping", "Refreshment", "Ambulance", "Networking", "Any Additional Amenities"];
     allRequirements.forEach((req, index) => {
       const value = formData.requirements.includes(req) ? "Yes" : "No";
       doc.text(`${index + 1}. ${req}: ${value}`, marginLeftCol2, currentY + index * 5);
     });

     currentY += 8 * 5
     doc.text(formData.anyAdditionalAmenities || "N/A", marginLeftCol2, currentY);

     // Draw border for Organizer Details
     currentY -= 55;
     doc.rect(10, currentY, pageWidth / 2 - 10, 60); // x, y, width, height
     // Draw border for Requirements section
     doc.rect(pageWidth / 2, currentY, pageWidth / 2 - 10, 60); // x, y, width, height

     //Description of the Event
     const marginLeft = 10;
     currentY += 68;
     doc.text("Brief Description of the Event: ", marginLeft, currentY).setFont(undefined, 'normal').text(" (A 4-line description is to be furnished)", marginLeft + 63, currentY, { maxWidth: pageWidth - 40 });
     currentY += 7;

     doc.setFontSize(11)
     // Wrap the text with maxWidth parameter
     const maxWidth = pageWidth - 20;  // Adjust max width based on your page layout
     // Text wrapping for event description
     doc.text(`${formData.eventDescription}`, marginLeft, currentY, { maxWidth: pageWidth - 40 });
     currentY += 21;

     doc.setFont(undefined, 'bold');
     doc.text(`Expected Number of Participants: (External: ${formData.externalParticipants}      Internal: ${formData.internalParticipants} )`, marginLeft, currentY); currentY += 7;
     doc.setFont(undefined, 'normal');
     doc.text(`If the external participants are invited, list of collaborating organizations: ${formData.listOfCollaboratingOrganizations}`, marginLeft, currentY); currentY += 7;

     //Declaration by the organizer
     doc.text([`I, ${formData.nameOfTheOrganizer}, Designation ${formData.designation} will take responsibility to organize and conduct the event to the best of my ability and as per the institute rules.`], marginLeft, currentY, { maxWidth: pageWidth - 40 });
     currentY += 10;

     doc.setFont(undefined, 'normal');
     doc.setFontSize(10)
     doc.text(["Please read the instructions overleaf. Please submit this form to the Students Welfare Office at least 2 weeks prior to the proposed event date. Seek the approval from the competent authority."], marginLeft, currentY,  { maxWidth: pageWidth - 40 });

     //Signatures
     //Upper Row (1)
     currentY += 30;
     doc.setFontSize(12)
     doc.text("Club Secretary", marginLeft + 10, currentY);
     doc.text("General Secretary", marginLeft + 55, currentY);
     doc.text("Treasurer", marginLeft + 110, currentY);
     doc.text("President", marginLeft + 150, currentY);

     //Lower Row (2)
     currentY += 25;
     doc.text("Faculty In Charge", marginLeft + 25, currentY);
     doc.text("Associate Dean", marginLeft + 130, currentY);

     doc.setFontSize(7)
     doc.setFont(undefined, 'normal');
     doc.text("Page-1 (to be completed by the applicant/student)", marginLeft, 295);



     // SECOND PAGE
     doc.addPage();
     doc.addImage(base64data, "JPEG", xPosition, 0, headerWidth, headerHeight);

     // Content for Page 2
     doc.setFontSize(12)
     doc.text("For Office Use: Administrative approval/Budget Approval", marginLeft + 40, 60);

     // Administrative approval section (empty fields for office use)
     // doc.setDrawColor(0);
     // doc.rect(10, 60, pageWidth - 20, 50); // x, y, width, height (adjust as needed for spacing)
     doc.text("Dean", pageWidth / 2, 150, { align: "center" });
     doc.text("Student Welfare", pageWidth / 2, 155, { align: "center" });

     // Add separator
     doc.setDrawColor(0);
     doc.line(10, 160, pageWidth - 10, 160); // Horizontal line

     // Instructions to Students Section
     doc.setFont(undefined, "bold");
     doc.text("Instructions to the Students:", pageWidth / 2, 170, { align: "center" });
     doc.setFont(undefined, "normal");
     doc.text(["You are requested to adhere to the below points and make appropriate arrangements ", "and submit the Form at least 2 weeks prior."], marginLeft, 175)
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
     ];
     let yPosition = 185;
     let cnt = 1;
     instructions.forEach((instruction) => {
       doc.text(`${cnt}. ${instruction}`, marginLeft + 10, yPosition, { maxWidth: pageWidth - 40 });
       yPosition += 10; // Adjust line spacing as needed
       cnt += 1;
     });


    // Generate the PDF Blob and display it in an iframe
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const previewElement = document.getElementById("pdf-preview");
    if (previewElement) previewElement.src = pdfUrl;
  };
};