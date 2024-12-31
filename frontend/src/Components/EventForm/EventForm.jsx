import { useState } from "react";
import { jsPDF } from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";

const EventForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    phoneNumber: "",
    email: "",
    eventName: "",
    eventType: "",
    eventDates: "",
    eventVenue: "",
    helpRequired: [],
    eventDescription: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      helpRequired: checked
        ? [...prevData.helpRequired, value]
        : prevData.helpRequired.filter((item) => item !== value),
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add content to the PDF
    doc.setFontSize(12);
    doc.text("Event Proposal Form", 105, 10, { align: "center" });
    doc.text(`Name: ${formData.name}`, 10, 20);
    doc.text(`Designation: ${formData.designation}`, 10, 30);
    doc.text(`Phone Number: ${formData.phoneNumber}`, 10, 40);
    doc.text(`Email: ${formData.email}`, 10, 50);
    doc.text(`Event Name: ${formData.eventName}`, 10, 60);
    doc.text(`Event Type: ${formData.eventType}`, 10, 70);
    doc.text(`Event Dates: ${formData.eventDates}`, 10, 80);
    doc.text(`Event Venue: ${formData.eventVenue}`, 10, 90);
    doc.text(`Help Required: ${formData.helpRequired.join(", ")}`, 10, 100);
    doc.text("Event Description:", 10, 110);
    doc.text(formData.eventDescription, 10, 120, { maxWidth: 190 });

    // Declaration
    doc.text(
      `I, ${formData.name}, ${formData.designation}, hereby agree to conduct the event to the best of my abilities and follow all the rules and regulations set by the institute.`,
      10,
      140,
      { maxWidth: 190 }
    );

    // Save the PDF
    doc.save(`${formData.eventName}-Proposal.pdf`);
  };

  return (
    <div className="container mt-5">
      <h2>Event Proposal Form</h2>
      <form>
        <div className="mb-3">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
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
            placeholder="Enter your designation"
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
            placeholder="Enter your phone number"
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
            placeholder="Enter your email address"
            required
          />
        </div>
        <div className="mb-3">
          <label>Event Name</label>
          <input
            type="text"
            className="form-control"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            placeholder="Enter the event name"
            required
          />
        </div>
        <div className="mb-3">
          <label>Event Type</label>
          <select
            className="form-control"
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
          >       
            <option value="">Select Event Type</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Others">Others</option>
          </select>
        </div>
        <div className="mb-3">
          <label>Event Dates</label>
          <input
            type="text"
            className="form-control"
            name="eventDates"
            value={formData.eventDates}
            onChange={handleChange}
            placeholder="Enter the event dates"
            required
          />
        </div>
        <div className="mb-3">
          <label>Event Venue</label>
          <input
            type="text"
            className="form-control"
            name="eventVenue"
            value={formData.eventVenue}
            onChange={handleChange}
            placeholder="Enter the event venue"
            required
          />
        </div>
        <div className="mb-3">
          <label>Help Required</label>
          {["Networking", "Housekeeping", "Mess", "Hostel", "Academic"].map(
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
        </div>
        <div className="mb-3">
          <label>Event Description</label>
          <textarea
            className="form-control"
            name="eventDescription"
            rows="4"
            value={formData.eventDescription}
            onChange={handleChange}
            placeholder="Describe your event details"
            required
          ></textarea>
        </div>
        <button type="button" className="btn btn-primary" onClick={generatePDF}>
          Generate PDF
        </button>
      </form>
    </div>
  );
};

export default EventForm;
