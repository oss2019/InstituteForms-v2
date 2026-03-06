import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from "react-hot-toast";
import API from '/src/api/api';
import { generatePDF } from "../../utils/pdfGenerator";
import StudentDashboard from "../StudentDashboard/EventDashboard.jsx";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import "./EventForm.css";

import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs }         from "@mui/x-date-pickers/AdapterDayjs";
import { StaticTimePicker }     from "@mui/x-date-pickers/StaticTimePicker";
import { createTheme, ThemeProvider } from "@mui/material/styles";

/* ── MUI theme — Bootstrap blue, no shadows, natural font ──────────── */
const muiTheme = createTheme({
palette: { primary: { main: "#007bff" } },
typography: { fontFamily: "inherit" },

components: {
MuiPaper: {
styleOverrides: {
root: { boxShadow: "none" }
}
},

// expands the internal picker layout
MuiPickersLayout: {
  styleOverrides: {
    root: {
      minWidth: 360
    }
  }
},

// fixes header arrows clipping
MuiPickersCalendarHeader: {
  styleOverrides: {
    root: {
      paddingLeft: 12,
      paddingRight: 12,
      justifyContent: "space-between"
    }
  }
},

// ensures arrow buttons get space
MuiPickersArrowSwitcher: {
  styleOverrides: {
    root: {
      width: 80,
      display: "flex",
      justifyContent: "space-between"
    }
  }
}


},
});


/* ═══════════════════════════════════════════════════════════════════
   DateWithMUITimePicker
   ─ date <input> for the calendar part
   ─ button shows the current time and opens the clock
   ─ clock popover is rendered via ReactDOM.createPortal into
     document.body at a FIXED position so it escapes every
     overflow:hidden / overflow:clip Bootstrap container
═══════════════════════════════════════════════════════════════════ */
const DateWithMUITimePicker = ({ value, onChange, minValue, label, id }) => {
  const [showClock, setShowClock]     = useState(false);
  const [pendingTime, setPendingTime] = useState(null);
  // popoverPos: { top, left } in viewport px (used for position:fixed)
  const [popoverPos, setPopoverPos]   = useState({ top: 0, left: 0 });

  const triggerRef = useRef(null); // the clock-button element
  const popoverRef = useRef(null);

  const datePart = value   ? value.split("T")[0]             : "";
  const timePart = value   ? (value.split("T")[1] || "00:00") : "00:00";
  const minDate  = minValue ? minValue.split("T")[0]         : "";

  const djsValue = dayjs(`2000-01-01T${timePart}`);

  const [hh, mm] = timePart.split(":").map(Number);
  const isAM  = hh < 12;
  const h12   = hh % 12 || 12;
  const timeLabel = datePart
    ? `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${isAM ? "AM" : "PM"}`
    : "Set time";

  const handleDateChange = (e) => onChange(`${e.target.value}T${timePart}`);
  const handleClockChange = (v) => { if (v) setPendingTime(v); };

  const handleDone = () => {
    const t = (pendingTime || djsValue).format("HH:mm");
    onChange(`${datePart || dayjs().format("YYYY-MM-DD")}T${t}`);
    setShowClock(false);
    setPendingTime(null);
  };

  const handleCancel = () => {
    setShowClock(false);
    setPendingTime(null);
  };

  /* Open: measure the trigger button position so we can place the
     portal popover directly below it using fixed coordinates          */
  const handleOpenClock = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Place below the button; if near bottom of viewport, flip upward
      const spaceBelow = window.innerHeight - rect.bottom;
      const popH = 420; // approximate picker height
      const top  = spaceBelow >= popH
        ? rect.bottom + 6
        : rect.top - popH - 6;
      setPopoverPos({ top, left: rect.left });
    }
    setShowClock(prev => !prev);
  };

  /* Re-position on scroll / resize while open */
  useEffect(() => {
    if (!showClock) return;
    const reposition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const popH = 420;
        const top  = spaceBelow >= popH ? rect.bottom + 6 : rect.top - popH - 6;
        setPopoverPos({ top, left: rect.left });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [showClock]);

  /* Close on outside click */
  useEffect(() => {
    if (!showClock) return;
    const handler = (e) => {
      if (
        popoverRef.current  && !popoverRef.current.contains(e.target) &&
        triggerRef.current  && !triggerRef.current.contains(e.target)
      ) {
        handleCancel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showClock]);

  /* ── Portal content ─────────────────────────────────────────────── */
  const pickerPortal = showClock && createPortal(
    <div
      ref={popoverRef}
      style={{
        position   : "fixed",
        top        : popoverPos.top,
        left       : popoverPos.left,
        zIndex     : 99999,        // above everything — modals, navbars, etc.
        background : "#fff",
        border     : "1px solid #dee2e6",
        borderRadius: 12,
        boxShadow  : "0 8px 28px rgba(0,0,0,0.15)",
        padding    : "8px 8px 4px",
        /* Let MUI dictate the width naturally — no min/max-width here */
      }}
    >
      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StaticTimePicker
            value={pendingTime ?? djsValue}
            onChange={handleClockChange}
            /* Remove MUI's built-in action bar; we render our own */
            slots={{ actionBar: () => null }}
            slotProps={{ toolbar: { hidden: false } }}
          />
        </LocalizationProvider>
      </ThemeProvider>

      {/* Bootstrap-styled action row */}
      <div style={{
        display: "flex", justifyContent: "flex-end",
        gap: 8, padding: "4px 8px 8px",
      }}>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleDone}>
          Done
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <div>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="date" id={id}
          className="form-control" style={{ maxWidth: 180 }}
          value={datePart} onChange={handleDateChange} min={minDate}
        />
        <button
          ref={triggerRef}
          type="button"
          className="btn btn-outline-secondary"
          style={{ whiteSpace: "nowrap" }}
          onClick={handleOpenClock}
        >
          🕐 {timeLabel}
        </button>
      </div>

      {pickerPortal}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   EventForm
═══════════════════════════════════════════════════════════════════ */
const EventForm = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    partOfGymkhanaCalendar: "",
    clubName: "",
    startDate: "",
    endDate: "",
    eventVenue: "",
    sourceOfBudget: "",
    fundType: "", // For General Secretary (SAF or HEF)
    othersSourceOfBudget: "",
    estimatedBudget: 0,
    budgetAnnexureNumber: "",
    budgetBreakup: [{ expenseHead: "", estimatedAmount: "" }],
    nameOfTheOrganizer: "",
    designation: "",
    email: "",
    phoneNumber: "",
    requirements: [],
    anyAdditionalAmenities: "",
    eventDescription: "",
    internalParticipants: "",
    externalParticipants: "",
    listOfCollaboratingOrganizations: "",
  });

  // Separate checkbox state for "Any Additional Amenities"
  const [amenitiesChecked, setAmenitiesChecked]   = useState(false);
  const [isAgreementChecked, setisAgreementChecked] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted]       = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl]           = useState("");
  const [pdfPreviewDataUrl, setPdfPreviewDataUrl]   = useState("");
  const [isPDFGenerated, setIsPDFGenerated]         = useState(false);
  const [userRole, setUserRole]                     = useState("");
  const pdfObjectUrlRef = useRef(null);

  useEffect(() => {
    const userName = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    setUserRole(role);
    setFormData(prev => ({ ...prev, clubName: userName || "" }));
  }, []);

  useEffect(() => {
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
    };
  }, []);

  /* ── When amenities checkbox is unchecked, clear the text ──────── */
  const handleAmenitiesCheckbox = (e) => {
    const checked = e.target.checked;
    setAmenitiesChecked(checked);
    if (!checked) setFormData(prev => ({ ...prev, anyAdditionalAmenities: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGeneratePDF = async () => {
    const headerImageURL = "/form_header.png";
    try {
      const { blobUrl, dataUrl } = await generatePDF(formData, headerImageURL);
      if (pdfObjectUrlRef.current) URL.revokeObjectURL(pdfObjectUrlRef.current);
      pdfObjectUrlRef.current = blobUrl;
      setPdfPreviewUrl(blobUrl);
      setPdfPreviewDataUrl(dataUrl);
      setIsPDFGenerated(true);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast.error("Unable to generate PDF preview. Please try again.");
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      let updated;
      if (checked) {
        if (!prevData.requirements.some(r => r.name === value)) {
          updated = [...prevData.requirements, { name: value, description: "" }];
        } else {
          updated = prevData.requirements;
        }
      } else {
        updated = prevData.requirements.filter(item => item.name !== value);
      }
      return {
        ...prevData,
        requirements: updated.filter(req => req.name && req.name.trim() !== ""),
      };
    });
  };

  const handleRequirementDescriptionChange = (requirementName, description) => {
    setFormData((prevData) => ({
      ...prevData,
      requirements: prevData.requirements.map(req =>
        req.name === requirementName ? { ...req, description } : req
      ),
    }));
  };

  const handleDateValidation = () => {
    if (formData.startDate && formData.endDate &&
        new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End Date cannot be before the Start Date.");
      setFormData({ ...formData, endDate: "" });
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "eventName", "partOfGymkhanaCalendar", "clubName", "startDate", "endDate",
      "eventVenue", "sourceOfBudget", "budgetAnnexureNumber", "nameOfTheOrganizer",
      "designation", "email", "phoneNumber", "eventDescription",
      "externalParticipants", "internalParticipants",
    ];

    // Add fundType validation for General Secretary
    if (userRole === "general-secretary") {
      if (!formData.fundType) {
        toast.error("Please select a fund type (SAF or HEF).");
        return false;
      }
    }

    if (requiredFields.some(field => {
      const val = formData[field];
      if (field === "eventDescription") {
        const stripped = (val || "").replace(/<[^>]*>/g, "").trim();
        return !stripped;
      }
      return !val;
    })) return false;

    if (Number(formData.externalParticipants) > 0 && !formData.listOfCollaboratingOrganizations)
      return false;

    if (formData.requirements.some(req => !req.description || req.description.trim() === ""))
      return false;

    // If amenities checkbox is ticked, a description is required
    if (amenitiesChecked && !formData.anyAdditionalAmenities?.trim())
      return false;

    return true;
  };

  const handleBudgetChange = (index, e) => {
    const { name, value } = e.target;
    const list  = [...formData.budgetBreakup];
    list[index][name] = value;
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
    const list  = [...formData.budgetBreakup];
    list.splice(index, 1);
    const total = list.reduce((acc, curr) => acc + Number(curr.estimatedAmount || 0), 0);
    setFormData({ ...formData, budgetBreakup: list, estimatedBudget: total });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (formData.requirements.some(req => !req.description || req.description.trim() === "")) {
        toast.error("Please fill in descriptions for all selected requirements.");
      } else if (amenitiesChecked && !formData.anyAdditionalAmenities?.trim()) {
        toast.error("Please describe the additional amenities required.");
      } else {
        toast.error("Please fill out all required fields.");
      }
      return;
    }

    const userID      = localStorage.getItem("userID");
    const requestData = { ...formData, userID };

    try {
      const response = await API.post("/event/apply", requestData);
      toast.success(response.data.message || "Event proposal submitted successfully!");
      setTimeout(() => setIsFormSubmitted(true), 1200);
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error(error.response?.data?.message || "Failed to submit the proposal.");
    }
  };

  if (isFormSubmitted) return <StudentDashboard />;

  return (
    <div className="event-form-container container my-4">
      <Toaster position="top-center" />
      <h2 className="text-center mb-4">Event Proposal Form</h2>

      <form noValidate>

        {/* ── Event Name ─────────────────────────────────────────── */}
        <div className="mb-3">
          <label htmlFor="eventName" className="form-label">Event Name</label>
          <input
            type="text" className="form-control"
            id="eventName" name="eventName"
            value={formData.eventName} onChange={handleChange} required
          />
        </div>

        {/* ── Gymkhana Calendar ──────────────────────────────────── */}
        <div className="mb-3">
          <label htmlFor="partOfGymkhanaCalendar" className="form-label">Part of Gymkhana Calendar?</label>
          <select
            className="form-select"
            id="partOfGymkhanaCalendar" name="partOfGymkhanaCalendar"
            value={formData.partOfGymkhanaCalendar} onChange={handleChange} required
          >
            <option value="" disabled>Select...</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>

        {/* ── Club Name (read-only) ──────────────────────────────── */}
        <div className="mb-3">
          <label htmlFor="clubName" className="form-label">Club Name</label>
          <input
            type="text" className="form-control"
            id="clubName" name="clubName"
            value={formData.clubName} readOnly disabled
            style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
          />
        </div>

        {/* ── Dates with MUI Time Picker ─────────────────────────── */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <DateWithMUITimePicker
              id="startDate"
              label="Start Date & Time"
              value={formData.startDate}
              onChange={(val) => setFormData(prev => ({ ...prev, startDate: val }))}
              minValue={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <DateWithMUITimePicker
              id="endDate"
              label="End Date & Time"
              value={formData.endDate}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, endDate: val }));
                setTimeout(() => handleDateValidation(), 0);
              }}
              minValue={formData.startDate || new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>

        {/* ── Event Venue ────────────────────────────────────────── */}
        <div className="mb-3">
          <label htmlFor="eventVenue" className="form-label">Event Venue</label>
          <input
            type="text" className="form-control"
            id="eventVenue" name="eventVenue"
            value={formData.eventVenue} onChange={handleChange}
            placeholder="Event Venue (If multiple venues, mention all separated by comma)" required
          />
        </div>

        {/* ── Fund Type for General Secretary (SAF/HEF) ──────────── */}
        {userRole === "general-secretary" && (
          <div className="mb-3">
            <label className="form-label d-block">Select Fund Type:</label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                id="fundTypeSAF"
                name="fundType"
                value="SAF"
                checked={formData.fundType === "SAF"}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="fundTypeSAF">
                SAF
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                id="fundTypeHEF"
                name="fundType"
                value="HEF"
                checked={formData.fundType === "HEF"}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="fundTypeHEF">
                HEF
              </label>
            </div>
          </div>
        )}

        {/* ── Source of Budget ───────────────────────────────────── */}
        <div className="mb-3">
          <label>Source of Budget/Fund</label>
          <select
            className="form-control"
            name="sourceOfBudget"
            value={formData.sourceOfBudget} onChange={handleChange}
          >
            <option value="" disabled>Select Source</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Others">Others (Mention below)</option>
          </select>
        </div>

        {/* ── Budget Annexure Number ─────────────────────────────── */}
        <div className="mb-3">
          <label htmlFor="budgetAnnexureNumber" className="form-label">
            Budget Annexure Number (in Club Budget)
          </label>
          <input
            type="text" className="form-control"
            id="budgetAnnexureNumber" name="budgetAnnexureNumber"
            value={formData.budgetAnnexureNumber} onChange={handleChange}
            placeholder="Mention Annexure No. as per the approved budget, put N/A if not applicable"
            min="1"
          />
        </div>

        {/* ── Others budget source ───────────────────────────────── */}
        {formData.sourceOfBudget === "Others" && (
          <div className="mb-3">
            <label>Mention the source of budget</label>
            <input
              type="text" className="form-control"
              name="othersSourceOfBudget"
              value={formData.othersSourceOfBudget} onChange={handleChange}
              placeholder="Since you selected Others, mention the source of budget"
              required
            />
          </div>
        )}

        {/* ── Estimated Budget (read-only total) ────────────────── */}
        <div className="mb-3">
          <label>Estimated Budget (Total)</label>
          <input
            type="number" className="form-control"
            name="estimatedBudget"
            value={formData.estimatedBudget}
            placeholder="Total will be calculated from the breakup table"
            readOnly required
          />
        </div>

        {/* ── Budget Breakup Table ───────────────────────────────── */}
        <div className="mb-3">
          <label>Budget Breakup: (As per the Budget Copy)</label>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Expense Head</th>
                <th>Estimated Amount (₹)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.budgetBreakup.map((item, index) => (
                <tr key={index}>
                  <td className="align-middle text-center">{index + 1}</td>
                  <td>
                    <input
                      type="text" className="form-control"
                      name="expenseHead" value={item.expenseHead}
                      onChange={(e) => handleBudgetChange(index, e)}
                      placeholder="e.g., Refreshments" required
                    />
                  </td>
                  <td>
                    <input
                      type="number" className="form-control"
                      name="estimatedAmount" value={item.estimatedAmount}
                      onChange={(e) => handleBudgetChange(index, e)}
                      placeholder="0" min="0" required
                    />
                  </td>
                  <td className="align-middle text-center">
                    <button
                      type="button" className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveRow(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddRow}>
            + Add Row
          </button>
        </div>

        {/* ── Organizer Details ──────────────────────────────────── */}
        <h4 className="mt-4 mb-3">Organizer Details</h4>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="nameOfTheOrganizer" className="form-label">Name</label>
            <input
              type="text" className="form-control"
              id="nameOfTheOrganizer" name="nameOfTheOrganizer"
              value={formData.nameOfTheOrganizer} onChange={handleChange} required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="designation" className="form-label">Designation</label>
            <input
              type="text" className="form-control"
              id="designation" name="designation"
              value={formData.designation} onChange={handleChange} required
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email" className="form-control"
              id="email" name="email"
              value={formData.email} onChange={handleChange} required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
            <input
              type="tel" className="form-control"
              id="phoneNumber" name="phoneNumber"
              value={formData.phoneNumber} onChange={handleChange} required
            />
          </div>
        </div>

        {/* ── Facilities checkboxes ──────────────────────────────── */}
        <div className="mb-3">
          <label className="form-label d-block">Requirements:</label>
          {["Security", "Transport", "IPS Related", "Housekeeping", "Refreshment", "Ambulance", "Networking"].map(req => (
            <div key={req} className="form-check form-check-inline">
              <input
                className="form-check-input" type="checkbox"
                id={`req-${req}`} value={req}
                checked={formData.requirements.some(r => r.name === req)}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label" htmlFor={`req-${req}`}>{req}</label>
            </div>
          ))}
        </div>

        {/* Selected requirements description table */}
        {formData.requirements.filter(r => r.name?.trim()).length > 0 && (
          <div className="mb-3">
            <label className="form-label d-block mb-3">Selected Requirements - Details:</label>
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "5%" }}>Sl. No</th>
                  <th style={{ width: "30%" }}>Requirement/Facility</th>
                  <th style={{ width: "65%" }}>Brief Description</th>
                </tr>
              </thead>
              <tbody>
                {formData.requirements.filter(r => r.name?.trim()).map((req, index) => (
                  <tr key={`${req.name}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{req.name}</td>
                    <td>
                      <input
                        type="text" className="form-control"
                        placeholder="Enter description for this requirement"
                        value={req.description}
                        onChange={(e) => handleRequirementDescriptionChange(req.name, e.target.value)}
                        required
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Any Additional Amenities (checkbox + conditional input) */}
        <div className="mb-3">
          <div className="form-check mb-2">
            <input
              className="form-check-input" type="checkbox"
              id="amenitiesCheck"
              checked={amenitiesChecked}
              onChange={handleAmenitiesCheckbox}
            />
            <label className="form-check-label" htmlFor="amenitiesCheck">
              Any Additional Amenities Required?
            </label>
          </div>
          {amenitiesChecked && (
            <input
              type="text" className="form-control"
              id="anyAdditionalAmenities" name="anyAdditionalAmenities"
              value={formData.anyAdditionalAmenities}
              onChange={handleChange}
              placeholder="Describe the additional amenities needed"
              required
            />
          )}
        </div>

        {/* ── Event Description (ReactQuill) ─────────────────────── */}
        <div className="mb-3">
          <label htmlFor="eventDescription" className="form-label">
            Brief Description of the Event
          </label>
          {/* Outer div controls the visible height of the editor */}
          <div style={{ minHeight: 180 }}>
            <ReactQuill
              theme="snow"
              value={formData.eventDescription}
              onChange={(value) => setFormData({ ...formData, eventDescription: value })}
              placeholder="Give a brief description of the event."
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ],
              }}
              /* Make the editor area itself taller so all content is visible */
              style={{ backgroundColor: "#fff" }}
            />
          </div>
          {/* Global style injected inline to target Quill's inner editor div */}
          <style>{`
            .ql-editor {
              min-height: 160px !important;
              font-size: 14px !important;
              line-height: 1.6 !important;
            }
            .ql-container {
              min-height: 160px !important;
            }
          `}</style>
        </div>

        {/* ── Participants ───────────────────────────────────────── */}
        <h4 className="mt-4 mb-3">Expected Number of Participants</h4>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="internalParticipants" className="form-label">Internal Participants</label>
            <input
              type="number" className="form-control"
              id="internalParticipants" name="internalParticipants"
              value={formData.internalParticipants} onChange={handleChange}
              min="0" required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="externalParticipants" className="form-label">External Participants</label>
            <input
              type="number" className="form-control"
              id="externalParticipants" name="externalParticipants"
              value={formData.externalParticipants} onChange={handleChange}
              min="0" required
            />
          </div>
        </div>

        {Number(formData.externalParticipants) > 0 && (
          <div className="mb-3">
            <label htmlFor="listOfCollaboratingOrganizations" className="form-label">
              List of Collaborating Organizations
            </label>
            <input
              type="text" className="form-control"
              id="listOfCollaboratingOrganizations" name="listOfCollaboratingOrganizations"
              value={formData.listOfCollaboratingOrganizations} onChange={handleChange}
              placeholder="List organizations separated by commas" required
            />
          </div>
        )}

        {/* ── Agreement checkbox ─────────────────────────────────── */}
        <div className="form-check my-4">
          <input
            className="form-check-input" type="checkbox"
            id="responsibilityCheck"
            checked={isAgreementChecked}
            onChange={() => setisAgreementChecked(!isAgreementChecked)}
          />
          <label className="form-check-label" htmlFor="responsibilityCheck">
            I, <strong>{formData.nameOfTheOrganizer || "[Organizer Name]"}</strong>, will take
            full responsibility to organize and conduct the event to the best of my ability and
            as per institute rules.
          </label>
        </div>

        <div className="d-flex justify-content-start gap-2">
          <button
            type="button" className="btn btn-primary"
            onClick={handleGeneratePDF} disabled={!isAgreementChecked}
          >
            Generate PDF
          </button>
          <button
            type="button" className="btn btn-success"
            onClick={handleSubmit} disabled={!isAgreementChecked}
          >
            Submit for Approval
          </button>
        </div>
      </form>

      {/* ── PDF Preview ─────────────────────────────────────────── */}
      {isPDFGenerated && (
        <>
          <iframe
            id="pdf-preview"
            key={pdfPreviewUrl || pdfPreviewDataUrl}
            title="PDF Preview"
            style={{
              width: "100%", height: "500px",
              marginTop: "20px", border: "1px solid #dee2e6",
            }}
            src={pdfPreviewUrl || pdfPreviewDataUrl || undefined}
            type="application/pdf"
          />
          {!pdfPreviewUrl && pdfPreviewDataUrl && (
            <p style={{ marginTop: "8px" }}>
              If the preview stays blank,&nbsp;
              <a href={pdfPreviewDataUrl} target="_blank" rel="noopener noreferrer">
                open the PDF in a new tab
              </a>.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default EventForm;