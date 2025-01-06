import { useState } from "react";
import { jsPDF } from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from "react-hot-toast";
import "./EventForm.css";
import API from '../../api/api';  // Go back two directories to access src/api/api.js

const EventForm = () => {
  const [formData, setFormData] = useState({

    //Event Details:
    eventName: "", //1a (index no as in official form)
    partOfGymkhanaCalendar: "",//1b
    eventType: "", //extra variable: Not in official form, just to track type of event
    clubName: "", //2
    startDate: "", //3a
    endDate: "", //3b
    eventVenue: "", //4
    sourceOfBudget: "", //5
    estimatedBudget: "", //6

    //Organizer Details:
    nameOfTheOrganizer: "", //1
    designation: "", //2
    email: "", //3
    phoneNumber: "", //4

    //Requirements
    requirements: [],
    anyAdditionalAmenities: "",

    //Brief Description of the Event:
    eventDescription: "",

    //Expected Number of Participants
    internalParticipants: "",
    externalParticipants: "",
    listOfCollaboratingOrganizations: "N/A"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // State to track if the agreement checkbox is checked
  const [isAgreementChecked, setisAgreementChecked] = useState(false);

  // Function to handle agreement checkbox change
  const handleAgreementCheckboxChange = () => {
    setisAgreementChecked(!isAgreementChecked);
  };

  const today = new Date().toISOString().split("T")[0];

  const handleDateValidation = () => {
    const { dateOfLeaving, arrivalDate } = formData;

    // Validate that dateOfLeaving is not in the past
    if (dateOfLeaving && new Date(dateOfLeaving) < new Date(today)) {
      toast.error("Date of Event cannot be in the past.");
      setFormData({ ...formData, EventFrom: "" });
      return;
    }

    // Validate that arrivalDate is not before dateOfLeaving
    if (
      arrivalDate &&
      dateOfLeaving &&
      new Date(arrivalDate) < new Date(dateOfLeaving)
    ) {
      toast.error("Event End date cannot be before the date of Event.");
      setFormData({ ...formData, EventTo: "" });
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      requirements: checked
        ? [...prevData.requirements, value]
        : prevData.requirements.filter((item) => item !== value),
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "eventName",
      "partOfGymkhanaCalendar",
      "eventType",
      "clubName",
      "startDate",
      "endDate",
      "eventVenue",
      "sourceOfBudget",
      "estimatedBudget",
      "nameOfTheOrganizer",
      "designation",
      "email",
      "phoneNumber",
      "eventDescription",
      "externalParticipants",
      "internalParticipants"
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        return false;  // Return false if any required field is empty
      }
    }

    // Additional check for listOfCollaboratingOrganizations if externalParticipants > 0
    if (formData.externalParticipants > 0 && !formData.listOfCollaboratingOrganizations) {
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("All fields are required to be filled!");
      return; // Do not proceed if the form is not valid
    }

    const userID = localStorage.getItem("userID");

    // Include userID and match backend schema
    const requestData = {
      ...formData,
      userID,
      startDate: formData.startDate,
      endDate: formData.endDate,
    };

    try {
      const response = await API.post("/event/apply", requestData);
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error submitting event approval:", error.message);
      toast.error(error.response?.data?.message || "Failed to submit the event approval.");
    }
  };

  const generatePDF = async () => {
    // if (!validateForm()) {
    //   toast.error("All fields are required to be filled!");
    //   return; // Do not proceed if the form is not valid
    // }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 40; // Adjust as needed
    const headerWidth = 180; // Adjust as needed

    // Load the header image (ensure the image is accessible as a URL or base64 string)
    const headerImageURL = "/form_header.png"; // Replace with actual path or URL
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



      // Generate the PDF as a Blob
      const pdfBlob = doc.output('blob');

      // Create a URL for the Blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Embed the PDF in the iframe
      document.getElementById('pdf-preview').src = pdfUrl;

      // Save PDF
      // doc.save(`${formData.eventName || "Event"}-Permission-Request.pdf`);
    };

  };

  // generatePDF();
  return (
    <div className="container mt-5">
      <Toaster />
      <h2>Event Proposal Form</h2>
      <form>

        <div className="mb-3">
          <label>Event Name</label>
          <input
            type="text"
            className="form-control"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            placeholder="Event name"
            required
          />
        </div>

        <div className="mb-3">
          <label>Is it part of the Gymkhana Calendar ?</label>
          <select
            className="form-control"
            name="partOfGymkhanaCalendar"
            value={formData.partOfGymkhanaCalendar}
            onChange={handleChange}
          >
            <option value="" disabled>YES or NO</option>
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Event Type</label>
          <select
            className="form-control"
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
          >
            <option value="" disabled>Event Type</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Club Name</label>
          <input
            type="text"
            className="form-control"
            name="clubName"
            value={formData.clubName}
            onChange={handleChange}
            placeholder="Club name"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Event Dates</label>
          <div className="date-inputs-row">
            <div className="date-input-container">
              <label className="form-label"><i>Start Date</i></label>
              <input
                type="date"
                name="startDate"
                onChange={handleChange}
                onBlur={handleDateValidation}
                value={formData.startDate}
                min={today}
                required
                className="form-input"
              />
            </div>
            <div className="date-input-container">
              <label className="form-label"><i>End Date</i></label>
              <input
                type="date"
                name="endDate"
                onChange={handleChange}
                onBlur={handleDateValidation}
                value={formData.endDate}
                required
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label>Event Venue</label>
          <input
            type="text"
            className="form-control"
            name="eventVenue"
            value={formData.eventVenue}
            onChange={handleChange}
            placeholder="Event venue"
            required
          />
        </div>

        <div className="mb-3">
          <label>Source of Budget/Fund</label>
          <select
            className="form-control"
            name="sourceOfBudget"
            value={formData.sourceOfBudget}
            onChange={handleChange}
          >
            <option value="" disabled>Select source</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Estimated Budget</label>
          <input
            type="number"
            className="form-control"
            name="estimatedBudget"
            value={formData.estimatedBudget}
            onChange={handleChange}
            placeholder="Estimated budget (in INR)"
            required
          />
        </div>

        {/* Organizer Details */}
        <div className="mb-3">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            name="nameOfTheOrganizer"
            value={formData.nameOfTheOrganizer}
            onChange={handleChange}
            placeholder="Organizer name"
            required
          />
        </div>

        <div className="mb-3">
          <label>Designation</label>
          <input
            type="text"
            className="form-control"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="Organizer Designation"
            required
          />
        </div>

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Organizer Email Address"
            required
          />
        </div>

        <div className="mb-3">
          <label>Phone Number</label>
          <input
            type="text"
            className="form-control"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Organizer Phone Number"
            required
          />
        </div>

        {/* Requirements */}
        <div className="mb-3">
          <label>Requirements:</label>
          {["Security", "Transport", "IPS Related", "Housekeeping", "Refreshment", "Ambulance", "Networking"].map(
            (help) => (
              <div key={help} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={help}
                  onChange={handleCheckboxChange}
                />
                <label className="form-check-label">{help}</label>
              </div>
            )
          )}

          <div className="mb-3 mt-3">
            <label>Any additional amenities:</label>
            <input
              type="text"
              className="form-control"
              name="anyAdditionalAmenities"
              value={formData.anyAdditionalAmenities}
              onChange={handleChange}
            // placeholder=""
            />
          </div>
        </div>

        {/* Event Description */}
        <div className="mb-3">
          <label> Brief Description of the Event:</label>
          <textarea
            className="form-control"
            name="eventDescription"
            rows="4"
            value={formData.eventDescription}
            onChange={handleChange}
            placeholder="A 4 line description is to be furnished."
            required
          ></textarea>
        </div>

        {/* Expected Number of Participants */}
        <label className="mb-1">Expected Number of Participants</label>
        <div className="mb-3">
          <label><i>External</i></label>
          <input
            type="number"
            className="form-control"
            name="externalParticipants"
            value={formData.externalParticipants}
            onChange={handleChange}
            placeholder="Expected Number of External Participants"
            required
          />
        </div>

        {formData.externalParticipants > 0 ? (
          <div className="mb-3">
            <label>List of Collaborating Organizations:</label>
            <input
              type="text"
              className="form-control"
              name="listOfCollaboratingOrganizations"
              value={formData.listOfCollaboratingOrganizations}
              onChange={handleChange}
              placeholder="Since external participants are invited, list of collaborating organizations:"
              required
            />
          </div>
        ) : (
          <div className="mb-3">
            {/* <label>List of Collaborating Organizations:</label>
            <input
              type="number"
              className="form-control"
              name="listOfCollaboratingOrganizations"
              value={formData.listOfCollaboratingOrganizations}
              onChange={handleChange}
              placeholder="Since external participants are invited, list of collaborating organizations:"
              disabled
            /> */}
          </div>
        )
        }

        <div className="mb-3">
          <label><i>Internal</i></label>
          <input
            type="number"
            className="form-control"
            name="internalParticipants"
            value={formData.internalParticipants}
            onChange={handleChange}
            placeholder="Expected Number of Internal Participants"
            required
          />
        </div>

        {/* Checkbox for agreement */}
        <div className="form-check d-flex align-items-center">
          <input
            className="form-check-input"
            type="checkbox"
            id="responsibilityCheck"
            checked={isAgreementChecked}
            onChange={handleAgreementCheckboxChange}
          />
          <label className="form-check-label ms-2" htmlFor="responsibilityCheck">
            I, {formData.nameOfTheOrganizer}, Designation: {formData.designation}, will take responsibility to organize and conduct the event to the best of my ability and as per the institute rules.
          </label>
        </div>

        {/* Disable the button if the agreement checkbox is not checked */}
        <button type="button" className="mb-3 btn btn-primary" onClick={generatePDF} disabled={!isAgreementChecked}>
          Generate PDF
        </button>

        {/* Submit button */}
        <button
          type="button"
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={!isAgreementChecked}
        >
          Submit for Approval
        </button>
      </form>

      <br></br>

      <iframe id="pdf-preview" style={{ width: "100%", height: "500px" }}></iframe>

    </div>

  );
};

export default EventForm;
