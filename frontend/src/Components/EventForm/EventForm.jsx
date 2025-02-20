import { useState } from "react";
import { jsPDF } from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from "react-hot-toast";
import "./EventForm.css";
import API from '/src/api/api';  // Go back two directories to access src/api/api.js

import { generatePDF } from "../../utils/pdfGenerator";

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
    listOfCollaboratingOrganizations: ""
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
    // Validate that `startDate` is not in the past
    if (formData.startDate && new Date(formData.startDate) < new Date(today)) {
      toast.error("Start Date cannot be in the past.");
      setFormData({ ...formData, startDate: "" });
      return;
    }
  
    // Validate that `endDate` is not before `startDate`
    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End Date cannot be before the Start Date.");
      setFormData({ ...formData, endDate: "" });
      return;
    }
  };

  const handleGeneratePDF = () => {
    const headerImageURL = "/form_header.png"; // Path to the header image
    generatePDF(formData, headerImageURL);
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
            placeholder="Event Name"
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
            placeholder="Club Name"
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
            placeholder="Event Venue"
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
            placeholder="Estimated Budget (in INR)"
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
            placeholder="Organizer Name"
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
            type="text"
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
            type="text"
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
        <button type="button" className="mb-3 btn btn-primary" onClick={handleGeneratePDF} disabled={!isAgreementChecked}>

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
