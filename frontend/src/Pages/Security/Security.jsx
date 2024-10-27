import React, { useState } from 'react';
import "./Security.css";
import QrcodeScanner from '../../Components/BarCodeScanner/BarCodeScanner.jsx';
import axios from 'axios';

const Security = () => {
    const [studentId, setStudentId] = useState("");
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [applicationId, setApplicationId] = useState(""); // To store the scanned application ID

    const handleScan = (id) => {
        setStudentId(id);
        fetchUserData(id);
    };

    const fetchUserData = async (rollNumber) => {
        setLoading(true);
        setError(null); // Reset error state
        try {
            const response = await axios.post("http://localhost:4001/user/details", {
                rollNumber: rollNumber
            });
            setUserData(response.data);
            // Optionally set applicationId here if you have it in the user data
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError("User not found or error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleScanLeave = async () => {
        try {
            const response = await axios.patch(`http://localhost:4001/leave/scan/${applicationId}`); // Scanning leave application
            alert(response.data.message);
        } catch (err) {
            console.error("Error scanning leave application:", err);
            setError("Error scanning application.");
        }
    };

    const handleScanAgain = () => {
        setStudentId(""); // Reset the student ID
        setUserData(null); // Clear user data
        setError(null); // Clear error state
        setApplicationId(""); // Reset application ID
    };

    return (
        <div className="security-container">
            <header className="App-header">
                <h1>Security Page</h1>
                <p>Welcome to the Security section!</p>
                <h1>BAR Code Scanner</h1>
            </header>
            <QrcodeScanner onScan={handleScan} onScanAgain={handleScanAgain} /> {/* Pass handleScanAgain to BarcodeScanner */}
            {loading && <p>Loading user data...</p>}
            {error && <p>{error}</p>}
            {userData && (
                <div>
                    <h2>User Details</h2>
                    <p><strong>_id:</strong> {userData._id || "N/A"}</p>
                    <p><strong>Roll Number:</strong> {userData.rollNumber}</p>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Status:</strong> Approved</p>

    
                    <button onClick={handleScanLeave}>Scan Leave Application</button>
                </div>
            )}
        </div>
    );
};

export default Security;
