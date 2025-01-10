import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Use useNavigate hook
import axios from "axios";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "./EventDetails.css";

import { generatePDF } from "../../utils/pdfGenerator";

const EventDetails = () => {
  const { id } = useParams(); // Extract event ID from the route params
  const [eventDetails, setEventDetails] = useState(null); // State for event data
  const [isPDFGenerated, setIsPDFGenerated] = useState(false); // State for PDF visibility
  const [isLoading, setIsLoading] = useState(true); // State for loading indicator
  const navigate = useNavigate(); // Initialize navigate hook
  const role = localStorage.getItem("role"); // Fetch role from localStorage

  useEffect(() => {
    // Function to fetch event details by ID
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:4001/event/${id}`); // Correct API endpoint
        setEventDetails(response.data); // Update state with the fetched event data
      } catch (error) {
        toast.error("Error fetching event details!"); // Display error toast
        console.error("Error fetching event data:", error);
      } finally {
        setIsLoading(false); // Set loading to false
      }
    };

    fetchEventDetails(); // Call the fetch function
  }, [id]); // Dependency array to re-run the effect when `id` changes

  const handleStatusUpdate = async (applicationId, role, status) => {
    try {
      console.log("Sending request with:", { applicationId, role, status }); // Debug log
      const response = await axios.patch(
        `http://localhost:4001/event/${applicationId}/status`,
        { applicationId, role, status }
      );
      console.log("Response received:", response.data); // Debug log
  
      // Navigate back to the previous page after successful update
      toast.success(`Event ${status} successfully.`);
      navigate(-1); // Navigate back to the previous page
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
      toast.error("Failed to update status. Please try again.");
    }
  };
  
  const handleGeneratePDF = () => {
    const headerImageURL = "/form_header.png"; // Path to the header image
    generatePDF(eventDetails, headerImageURL);
    setIsPDFGenerated(true); // Show the iframe after PDF is generated
  };

  if (isLoading) return <div>Loading event details...</div>;
  if (!eventDetails) return <div>Error: Event not found.</div>;

  return (
    <div className="event-details-container">
      <h2>Event Details</h2>

      {/* Back button next to the event name */}
      <div className="event-details-header">
        <h3>{eventDetails.eventName}</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className="event-details-content">
        <p><strong>Type:</strong> {eventDetails.eventType}</p>
        <p><strong>Club Name:</strong> {eventDetails.clubName}</p>
        <p><strong>Start Date:</strong> {new Date(eventDetails.startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> {new Date(eventDetails.endDate).toLocaleDateString()}</p>
        <p><strong>Venue:</strong> {eventDetails.eventVenue}</p>
        <p><strong>Source of Budget:</strong> {eventDetails.sourceOfBudget}</p>
        <p><strong>Estimated Budget:</strong> ₹{eventDetails.estimatedBudget}</p>

        <h4>Organizer Details</h4>
        <p><strong>Name:</strong> {eventDetails.nameOfTheOrganizer}</p>
        <p><strong>Designation:</strong> {eventDetails.designation}</p>
        <p><strong>Email:</strong> {eventDetails.email}</p>
        <p><strong>Phone Number:</strong> {eventDetails.phoneNumber}</p>

        <h4>Requirements</h4>
        <ul>
          {eventDetails.requirements?.map((req, index) => <li key={index}>{req}</li>)}
        </ul>

        <h4>Description</h4>
        <p>{eventDetails.eventDescription}</p>

        <h4>Participants</h4>
        <p><strong>External:</strong> {eventDetails.externalParticipants}</p>
        <p><strong>Internal:</strong> {eventDetails.internalParticipants}</p>

        {eventDetails.externalParticipants > 0 && (
          <p><strong>Collaborating Organizations:</strong> {eventDetails.listOfCollaboratingOrganizations}</p>
        )}

        {/* Render Approve and Reject buttons only if the role is not 'club-secretary' */}
        {role !== "club-secretary" && (
          <>
            <button
              className="btn btn-success mb-1"
              onClick={() => handleStatusUpdate(eventDetails._id, role, "Approved")}
            >
              Approve
            </button>
            <button
              className="btn btn-danger mb-1"
              onClick={() => handleStatusUpdate(eventDetails._id, role, "Rejected")}
            >
              Reject
            </button>
          </>
        )}

        <button className="btn btn-primary mb-1" onClick={handleGeneratePDF}>
          Generate & Preview PDF
        </button>
        {/* Conditionally render the iframe only after generating PDF */}
        {isPDFGenerated && (
          <iframe
            id="pdf-preview"
            className="pdf-preview"
            style={{ width: "100%", height: "500px", border: "none" }}
          ></iframe>
        )}
      </div>
    </div>
  );
};

export default EventDetails;