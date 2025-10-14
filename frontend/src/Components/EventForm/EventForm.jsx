import { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from "react-hot-toast";
import API from '/src/api/api';
import { generatePDF } from "../../utils/pdfGenerator";
import StudentDashboard from "../StudentDashboard/EventDashboard.jsx";
import "./EventForm.css";

const EventForm = () => {
  const [formData, setFormData] = useState({

    //Event Details:
    eventName: "", //1a (index no as in official form)
    partOfGymkhanaCalendar: "",//1b
    // eventType: "", //extra variable: Not in official form, just to track type of event
    clubName: "", //2
    startDate: "", //3a
    endDate: "", //3b
    eventVenue: "", //3c
    sourceOfBudget: "", //4a
    othersSourceOfBudget: "", //4b
    estimatedBudget: 0, //5 - Set initial value to 0
    budgetBreakup: [{ expenseHead: "", estimatedAmount: "" }], //array to hold the data of the "Budget Breakup" Table's rows

    //Organizer Details:
    nameOfTheOrganizer: "", //1
    designation: "", //2
    email: "", //3
    phoneNumber: "", //4

    //Requirements
    requirements: [],
    anyAdditionalAmenities: "",
    // Event Description
    eventDescription: "",
    // Participants
    internalParticipants: "",
    externalParticipants: "",
    listOfCollaboratingOrganizations: ""
  });

  const [isAgreementChecked, setisAgreementChecked] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfPreviewDataUrl, setPdfPreviewDataUrl] = useState("");
  const [isPDFGenerated, setIsPDFGenerated] = useState(false);
  const pdfObjectUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
    };
  }, []);

  // Get today's date in YYYY-MM-DD format for min attribute in date inputs
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGeneratePDF = async () => {
    const headerImageURL = "/form_header.png"; // Path to the header image
    try {
      const { blobUrl, dataUrl } = await generatePDF(formData, headerImageURL);

      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
      }

      pdfObjectUrlRef.current = blobUrl;
      setPdfPreviewUrl(blobUrl);
      setPdfPreviewDataUrl(dataUrl);
      // Show the preview iframe instead of forcing a download
      setIsPDFGenerated(true);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast.error("Unable to generate PDF preview. Please try again.");
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

  const handleDateValidation = () => {
    // Validate that endDate is not before startDate
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End Date cannot be before the Start Date.");
      setFormData({ ...formData, endDate: "" });
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "eventName", "partOfGymkhanaCalendar", "clubName", "startDate", "endDate",
      "eventVenue", "sourceOfBudget", "estimatedBudget", "nameOfTheOrganizer", "designation",
      "email", "phoneNumber", "eventDescription", "externalParticipants", "internalParticipants"
    ];

    if (requiredFields.some(field => !formData[field])) {
      return false;
    }

    // Conditionally require listOfCollaboratingOrganizations
    if (Number(formData.externalParticipants) > 0 && !formData.listOfCollaboratingOrganizations) {
      return false;
    }

    return true;
  };

  // Handlers for the Budget Breakup Table
  const handleBudgetChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...formData.budgetBreakup];
    list[index][name] = value;

    // Recalculate the total budget
    const total = list.reduce((acc, curr) => acc + Number(curr.estimatedAmount || 0), 0);

    setFormData({ ...formData, budgetBreakup: list, estimatedBudget: total });
  };

  const handleAddRow = () => {
    setFormData({
      ...formData,
      budgetBreakup: [...formData.budgetBreakup, { expenseHead: "", estimatedAmount: "" }],
    });
  };

  const handleRemoveRow = (index) => {
    const list = [...formData.budgetBreakup];
    list.splice(index, 1);

    // Recalculate the total budget
    const total = list.reduce((acc, curr) => acc + Number(curr.estimatedAmount || 0), 0);
    
    setFormData({ ...formData, budgetBreakup: list, estimatedBudget: total });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const userID = localStorage.getItem("userID");
    const requestData = { ...formData, userID };

    try {
      const response = await API.post("/event/apply", requestData);
      toast.success(response.data.message || "Event proposal submitted successfully!");
      setTimeout(() => {
        setIsFormSubmitted(true);
      }, 1200);
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error(error.response?.data?.message || "Failed to submit the proposal.");
    }
  };

  if (isFormSubmitted) {
    return <StudentDashboard />;
  }

  return (
    <div className="event-form-container container my-4">
      <Toaster position="top-center" />
      <h2 className="text-center mb-4">Event Proposal Form</h2>
      <form noValidate>
        {/* Event Details Section */}
        <div className="mb-3">
          <label htmlFor="eventName" className="form-label">Event Name</label>
          <input
            type="text"
            className="form-control"
            id="eventName"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="row">
          <div className="col-md-12 mb-6">
            <label htmlFor="partOfGymkhanaCalendar" className="form-label">Part of Gymkhana Calendar?</label>
            <select
              className="form-select"
              id="partOfGymkhanaCalendar"
              name="partOfGymkhanaCalendar"
              value={formData.partOfGymkhanaCalendar}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          {/* <div className="col-md-6 mb-3">
            <label htmlFor="eventType" className="form-label">Event Type</label>
            <select
              className="form-select"
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Others">Others</option>
            </select>
          </div> */}
        </div>

        <div className="mb-3">
          <label htmlFor="clubName" className="form-label">Club Name</label>
          <input
            type="text"
            className="form-control"
            id="clubName"
            name="clubName"
            value={formData.clubName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="startDate" className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={today}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="endDate" className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              onBlur={handleDateValidation}
              min={formData.startDate || today}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="eventVenue" className="form-label">Event Venue</label>
          <input
            type="text"
            className="form-control"
            id="eventVenue"
            name="eventVenue"
            value={formData.eventVenue}
            onChange={handleChange}
            placeholder="Event Venue (If multiple venues, mention all venues separted by comma)"
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
            <option value="" disabled>Select Source</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Others">Others (Mention below)</option>
          </select>
        </div>

        {formData.sourceOfBudget === "Others" ? (
          <div className="mb-3">
            <label>Mention the source of budget</label>
            <input
              type="text"
              className="form-control"
              name="othersSourceOfBudget"
              value={formData.othersSourceOfBudget}
              onChange={handleChange}
              placeholder="Since you have selected others, mention the source of budget:"
              required
            />
          </div>
        ) : (
          <div className="mb-3">
            {/*Hidden*/}
          </div>
        )
        }
        <div className="mb-3">
            <label>Estimated Budget (Total)</label>
            <input
              type="number"
              className="form-control"
              name="estimatedBudget"
              value={formData.estimatedBudget}
              placeholder="Total will be calculated from the breakup table"
              readOnly // This prop prevents the warning
              required
            />
        </div>

      {/* Budget Breakup Table */}
      <div className="mb-3">
        <label>Budget Breakup:(As per the Budget Copy)</label>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Sl.No</th>
              <th>Expense Head</th>
              <th>Estimated Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {formData.budgetBreakup.map((item, index) => (
              <tr key={index}>
                <td className="align-middle text-center">{index + 1}</td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    name="expenseHead"
                    value={item.expenseHead}
                    onChange={(e) => handleBudgetChange(index, e)}
                    placeholder="e.g., Refreshments"
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    name="estimatedAmount"
                    value={item.estimatedAmount}
                    onChange={(e) => handleBudgetChange(index, e)}
                    placeholder="0"
                    min="0"
                    required
                  />
                </td>
                {

                }
                
                <td className="align-middle text-center">
                  {formData.budgetBreakup.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveRow(index)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={handleAddRow}
        >
          + Add Row
        </button>
      </div>

        {/* Organizer Details */}
        {/* <div className="mb-3">
          <label>Name of the Organizer</label>
          <input
            type="text"
            className="form-control"
            name="nameOfTheOrganizer"
            value={formData.nameOfTheOrganizer}
            onChange={handleChange}
            placeholder="Organizer Name"
            required
          />
        </div> */}


        {/* Organizer Details Section */}
        <h4 className="mt-4 mb-3">Organizer Details</h4>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="nameOfTheOrganizer" className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              id="nameOfTheOrganizer"
              name="nameOfTheOrganizer"
              value={formData.nameOfTheOrganizer}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="designation" className="form-label">Designation</label>
            <input
              type="text"
              className="form-control"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Requirements Section */}
        <div className="mb-3">
          <label className="form-label d-block">Requirements:</label>
          {["Security", "Transport", "IPS Related", "Housekeeping", "Refreshment", "Ambulance", "Networking"].map(
            (req) => (
              <div key={req} className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`req-${req}`}
                  value={req}
                  onChange={handleCheckboxChange}
                />
                <label className="form-check-label" htmlFor={`req-${req}`}>{req}</label>
              </div>
            )
          )}
        </div>

        <div className="mb-3">
            <label htmlFor="anyAdditionalAmenities" className="form-label">Any Additional Amenities</label>
            <input
              type="text"
              className="form-control"
              id="anyAdditionalAmenities"
              name="anyAdditionalAmenities"
              value={formData.anyAdditionalAmenities}
              onChange={handleChange}
            />
        </div>


        {/* Event Description Section */}
        <div className="mb-3">
          <label htmlFor="eventDescription" className="form-label">Brief Description of the Event</label>
          <textarea
            className="form-control"
            id="eventDescription"
            name="eventDescription"
            rows="4"
            value={formData.eventDescription}
            onChange={handleChange}
            placeholder="Give a brief description of the event."
            required
          ></textarea>
        </div>

        {/* Participants Section */}
        <h4 className="mt-4 mb-3">Expected Number of Participants</h4>
        <div className="row">
            <div className="col-md-6 mb-3">
                <label htmlFor="internalParticipants" className="form-label">Internal Participants</label>
                <input
                    type="number"
                    className="form-control"
                    id="internalParticipants"
                    name="internalParticipants"
                    value={formData.internalParticipants}
                    onChange={handleChange}
                    min="0"
                    required
                />
            </div>
            <div className="col-md-6 mb-3">
                <label htmlFor="externalParticipants" className="form-label">External Participants</label>
                <input
                    type="number"
                    className="form-control"
                    id="externalParticipants"
                    name="externalParticipants"
                    value={formData.externalParticipants}
                    onChange={handleChange}
                    min="0"
                    required
                />
            </div>
        </div>

        {Number(formData.externalParticipants) > 0 && (
          <div className="mb-3">
            <label htmlFor="listOfCollaboratingOrganizations" className="form-label">List of Collaborating Organizations</label>
            <input
              type="text"
              className="form-control"
              id="listOfCollaboratingOrganizations"
              name="listOfCollaboratingOrganizations"
              value={formData.listOfCollaboratingOrganizations}
              onChange={handleChange}
              placeholder="List organizations separated by commas"
              required
            />
          </div>
        )}

        {/* Agreement and Submission */}
        <div className="form-check my-4">
          <input
            className="form-check-input"
            type="checkbox"
            id="responsibilityCheck"
            checked={isAgreementChecked}
            onChange={() => setisAgreementChecked(!isAgreementChecked)}
          />
          <label className="form-check-label" htmlFor="responsibilityCheck">
            I, <strong>{formData.nameOfTheOrganizer || "[Organizer Name]"}</strong>, will take full responsibility to organize and conduct the event to the best of my ability and as per institute rules.
          </label>
        </div>

        <div className="d-flex justify-content-start gap-2">
          <button type="button" className="btn btn-primary" onClick={handleGeneratePDF} disabled={!isAgreementChecked}>
            Generate PDF
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={!isAgreementChecked}
          >
            Submit for Approval
          </button>
        </div>
      </form>
      {isPDFGenerated && (
        <>
          <iframe
            id="pdf-preview"
            key={pdfPreviewUrl || pdfPreviewDataUrl}
            title="PDF Preview"
            style={{ width: "100%", height: "500px", marginTop: '20px', border: '1px solid #dee2e6' }}
            src={pdfPreviewUrl || pdfPreviewDataUrl || undefined}
            type="application/pdf"
          ></iframe>
          {!pdfPreviewUrl && pdfPreviewDataUrl && (
            <p style={{ marginTop: "8px" }}>
              If the preview stays blank, <a href={pdfPreviewDataUrl} target="_blank" rel="noopener noreferrer">open the PDF in a new tab</a>.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default EventForm;