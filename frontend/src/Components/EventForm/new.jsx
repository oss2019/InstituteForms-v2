import { useState } from "react";
import { jsPDF } from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from "react-hot-toast";
import "./EventForm.css";

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
    dateOfLeaving: "",
    arrivalDate: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateValidation = () => {
    const { dateOfLeaving, arrivalDate } = formData;

    if (dateOfLeaving && new Date(dateOfLeaving) < new Date(today)) {
      toast.error("Date of Event cannot be in the past.");
      setFormData({ ...formData, dateOfLeaving: "" });
      return;
    }

    if (arrivalDate && dateOfLeaving && new Date(arrivalDate) < new Date(dateOfLeaving)) {
      toast.error("Event End date cannot be before the date of Event.");
      setFormData({ ...formData, arrivalDate: "" });
    }
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

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 30;
    const headerWidth = 130;

    const headerImageURL = "/form_header.png";
    const imgData = await fetch(headerImageURL).then((res) => res.blob());
    const reader = new FileReader();
    reader.readAsDataURL(imgData);

    reader.onloadend = () => {
      const base64data = reader.result;
      const xPosition = (pageWidth - headerWidth) / 2;

      doc.addImage(base64data, "JPEG", xPosition, 10, headerWidth, headerHeight);

      doc.setFontSize(14).setFont(undefined, "bold");
      doc.text("Gymkhana Event Permission Request Form", 105, 40, { align: "center" });
      doc.setFontSize(12).setFont(undefined, "normal");
      doc.text("Event Details:", 10, 50);
      doc.text(`1) Event Name: ${formData.eventName}`, 10, 60);
      doc.text("(It is part of Gymkhana Calendar: YES/NO)", 10, 70);
      doc.text("2) Club Name:", 10, 80);
      doc.text(
        `3) Date/Duration (in days) of the Event proposed: ${formData.dateOfLeaving} to ${formData.arrivalDate}`,
        10,
        90
      );
      doc.text(
        `4) Venue (Mention all in case of multiple venues): ${formData.eventVenue}`,
        10,
        100
      );
      doc.text("5) Source of Budget/Fund:", 10, 110);
      doc.text(
        "   1) Sports Budget   2) Cultural Budget   3) Technical Budget   4) Others",
        10,
        120
      );
      doc.text("6) Estimated Budget:", 10, 130);

      doc.addPage();
      doc.addImage(base64data, "JPEG", xPosition, 10, headerWidth, headerHeight);

      doc.text("Organizer Details:", 10, 50);
      doc.text(`1) Name of the Organizer: ${formData.name}`, 10, 60);
      doc.text(`2) Designation: ${formData.designation}`, 10, 70);
      doc.text(`3) Email: ${formData.email}`, 10, 80);
      doc.text(`4) Phone No.: ${formData.phoneNumber}`, 10, 90);

      doc.text("Requirements:", 10, 100);
      const requirements = [
        "Security",
        "Transport",
        "IPS Related",
        "Housekeeping",
        "Refreshment",
        "Ambulance",
        "Networking",
      ];
      requirements.forEach((req, index) => {
        const value = formData.helpRequired.includes(req) ? "Yes" : "No";
        doc.text(`${index + 1}. ${req}: ${value}`, 10, 110 + index * 10);
      });

      doc.text("8. Any additional amenities:", 10, 190);
      doc.text("Brief Description of the Event:", 10, 200);
      doc.text(formData.eventDescription || "N/A", 10, 210, { maxWidth: 190 });

      doc.text(
        `I, ${formData.name}, ${formData.designation}, hereby take responsibility to organize and conduct the event to the best of my ability and as per the institute rules.`,
        10,
        220,
        { maxWidth: 190 }
      );

      doc.save(`${formData.eventName || "Event"}-Permission-Request.pdf`);
    };
  };

  return (
    <div className="container mt-5">
      <Toaster />
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
          <label className="form-label">Event Dates</label>
          <div className="date-inputs-row">
            <div className="date-input-container">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="dateOfLeaving"
                onChange={handleChange}
                onBlur={handleDateValidation}
                value={formData.dateOfLeaving}
                min={today}
                required
                className="form-input"
              />
            </div>
            <div className="date-input-container">
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="arrivalDate"
                onChange={handleChange}
                onBlur={handleDateValidation}
                value={formData.arrivalDate}
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
            placeholder="Enter the event venue"
            required
          />
        </div>
        <div className="mb-3">
          <label>Help Required</label>
          {["Networking", "Housekeeping", "Mess", "Hostel", "Academic"].map((help) => (
            <div key={help} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                value={help}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label">{help}</label>
            </div>
          ))}
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