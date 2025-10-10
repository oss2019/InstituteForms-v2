import { useState } from "react";
import { jsPDF } from "jspdf"; // Assuming this is used within generatePDF
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from "react-hot-toast";
import API from '/src/api/api';
import { generatePDF } from "../../utils/pdfGenerator";
import StudentDashboard from "../StudentDashboard/EventDashboard.jsx";
import "./EventForm.css";

const EventForm = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    partOfGymkhanaCalendar: "",
    eventType: "",
    clubName: "",
    startDate: "",
    endDate: "",
    eventVenue: "",
    sourceOfBudget: "",
    estimatedBudget: "",
    // Organizer Details
    nameOfTheOrganizer: "",
    designation: "",
    email: "",
    phoneNumber: "",
    // Requirements
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

  // Get today's date in YYYY-MM-DD format for min attribute in date inputs
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      "eventName", "partOfGymkhanaCalendar", "eventType", "clubName", "startDate", "endDate",
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

  const handleGeneratePDF = () => {
    const headerImageURL = "/form_header.png";
    generatePDF(formData, headerImageURL);
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
          <div className="col-md-6 mb-3">
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
          <div className="col-md-6 mb-3">
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
          </div>
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
            required
          />
        </div>

        <div className="row">
            <div className="col-md-6 mb-3">
                <label htmlFor="sourceOfBudget" className="form-label">Source of Budget/Fund</label>
                <select
                    className="form-select"
                    id="sourceOfBudget"
                    name="sourceOfBudget"
                    value={formData.sourceOfBudget}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>Select Source...</option>
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Others">Others</option>
                </select>
            </div>
            <div className="col-md-6 mb-3">
                <label htmlFor="estimatedBudget" className="form-label">Estimated Budget (in INR)</label>
                <input
                    type="number"
                    className="form-control"
                    id="estimatedBudget"
                    name="estimatedBudget"
                    value={formData.estimatedBudget}
                    onChange={handleChange}
                    placeholder="e.g., 5000"
                    min="0"
                    required
                />
            </div>
        </div>


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
            placeholder="A brief description of the event's purpose, activities, and goals."
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

      <iframe id="pdf-preview" title="PDF Preview" style={{ width: "100%", height: "500px", marginTop: '20px', border: '1px solid #dee2e6' }}></iframe>
    </div>
  );
};

export default EventForm;