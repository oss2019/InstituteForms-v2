import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Security.css";
import QrcodeScanner from '../../Components/BarCodeScanner/BarCodeScanner.jsx';
import axios from 'axios';

const Security = () => {
    const [studentId, setStudentId] = useState("");
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [upcomingLeave, setUpcomingLeave] = useState(null);
    const [isLeaveCompleted, setIsLeaveCompleted] = useState(false);
    const [outingData, setOutingData] = useState(null);
    const [outingScanned, setOutingScanned] = useState(false);
    const [showCamera, setShowCamera] = useState(true);

    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear all states
        setStudentId("");
        setUserData(null);
        setLoading(false);
        setError(null);
        setUpcomingLeave(null);
        setOutingData(null);
        setOutingScanned(false);
        setIsLeaveCompleted(false);
        setShowCamera(false); // Turn off camera

        // Remove token and navigate to home page
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleScan = (id) => {
        setStudentId(id);
        fetchUserData(id);
    };

    const fetchUserData = async (rollNumber) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post("http://localhost:4001/user/details", { rollNumber });
            setUserData(response.data);
            await fetchLeaveStatus(response.data._id);
            await fetchOutingStatus(response.data._id);
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError("User not found or error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveStatus = async (userID) => {
        if (!userID) return;
        try {
            const leavesResponse = await axios.post(`http://localhost:4001/leave/status`, { userID });
            setUpcomingLeave(leavesResponse.data);

            const { scanned, dateOfLeaving } = leavesResponse.data;
            if (scanned) {
                const timeDifference = new Date() - new Date(scanned);
                if (timeDifference > 3600000) await deleteLeaveApplication(leavesResponse.data._id);
            } else setIsLeaveCompleted(false);

            const currentDateStr = new Date().setHours(0, 0, 0, 0);
            const leavingDateStr = new Date(dateOfLeaving).setHours(0, 0, 0, 0);

            if (currentDateStr === leavingDateStr) {
                await scanLeaveApplication(leavesResponse.data._id);
            }
        } catch (err) {
            console.error("Error fetching leave status:", err);
            setError("Error fetching leave status.");
        }
    };

    const fetchOutingStatus = async (userID) => {
        if (!userID) return;
        try {
            const outingResponse = await axios.post(`http://localhost:4001/out/status`, { userID });
            setOutingData(outingResponse.data);
        } catch (err) {
            console.error("Error fetching outing status:", err);
            setError("Error fetching outing status.");
        }
    };

    const scanOutingApplication = async (applicationId) => {
        try {
            if (!outingData.outingRequest.scanned) {
                await axios.patch(`http://localhost:4001/out/scan/${applicationId}`);
                setOutingScanned(true);
            } else {
                await deleteOutingApplication(applicationId);
                setOutingScanned(false);
            }
        } catch (err) {
            console.error("Error updating outing application:", err);
            setError("Error updating outing application.");
        }
    };

    const deleteOutingApplication = async (applicationId) => {
        try {
            await axios.delete(`http://localhost:4001/out/delete/${applicationId}`);
            console.log("Outing application deleted successfully.");
        } catch (err) {
            console.error("Error deleting outing application:", err);
            setError("Error deleting outing application.");
        }
    };

    const scanLeaveApplication = async (applicationId) => {
        try {
            await axios.patch(`http://localhost:4001/leave/scan/${applicationId}`);
        } catch (err) {
            console.error("Error updating scanned date:", err);
            setError("Error updating scanned date.");
        }
    };

    const deleteLeaveApplication = async (applicationId) => {
        try {
            await axios.delete(`http://localhost:4001/leave/delete/${applicationId}`);
            console.log("Leave application deleted successfully.");
        } catch (err) {
            console.error("Error deleting leave application:", err);
            setError("Error deleting leave application.");
        }
    };

    const handleScanAgain = () => {
        setStudentId("");
        setUserData(null);
        setError(null);
        setUpcomingLeave(null);
        setOutingData(null);
        setOutingScanned(false);
        setIsLeaveCompleted(false);
    };

    return (
        <div className="security-container">
            <header className="App-header">
                <h1>Security Page</h1>
                <button onClick={handleLogout} className="logout-button">Logout</button> {/* Logout Button */}
                {showCamera && <QrcodeScanner onScan={handleScan} onScanAgain={() => setShowCamera(true)} />}
                <p>Welcome to the Security section!</p>
                <h1>BAR Code Scanner</h1>
            </header>
            <QrcodeScanner onScan={handleScan} onScanAgain={handleScanAgain} />
            {loading && <p>Loading user data...</p>}
            {/* {error && <p>{error}</p>} */}
            {userData && (
                <div>
                    <h2>User Details</h2>
                    <p><strong>_id:</strong> {userData._id || "N/A"}</p>
                    <p><strong>Roll Number:</strong> {userData.rollNumber}</p>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Status:</strong> {upcomingLeave ? upcomingLeave.status : "No leave applications found"}</p>
                    {isLeaveCompleted && <p>Leave is completed. The application has been deleted.</p>}
                </div>
            )}
            {outingData && (
                <div>
                    <h2>Outing Details</h2>
                    <p><strong>_id:</strong> {outingData.outingRequest._id || "N/A"}</p>
                    <p><strong>Status:</strong> {outingData.outingRequest.scanned ? "Outing Confirmed" : "Not Scanned"}</p>
                    <button onClick={() => scanOutingApplication(outingData.outingRequest._id)}>
                        {outingScanned ? "Outing Confirmed" : "Scan Outing"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Security;
