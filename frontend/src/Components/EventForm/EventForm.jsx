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
      "othersSourceOfBudget",
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
            <option value="" disabled>Select</option>
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
          readOnly //Since the total budget is calculated automatically from the table hence
          read-only
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
        <div className="mb-3">
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
            placeholder="Give a brief description of the event."
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
