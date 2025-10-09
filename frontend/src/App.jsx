import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home/Home.jsx";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute.jsx";
import StudentDashboard from "./Pages/Student DashBoard/StudentDashboard.jsx";
import StaffDashboard from "./Pages/Staff Dashboard/StaffDashboard.jsx";
import EventDetails from "./Pages/Event Details/EventDetails.jsx"; // Import EventDetails component
import { Toaster } from "react-hot-toast"; // Import the Toaster component
import PageNotFound from "./Pages/Page Not Found/PageNotFound.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google"; // Import GoogleOAuthProvider

function App() {
  const GOOGLE_CLIENT_ID ="126283465709-v64j607pjhd396kjsrn7qprhk2dns9ou.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/club-secretary"
            element={
              <ProtectedRoute requiredRoles={["club-secretary"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRoles={["general-secretary", "staff", "treasurer", "president", "faculty-in-charge", "associate-dean"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event-details/:id" // Add dynamic route for event details
            element={
              <ProtectedRoute requiredRoles={["general-secretary", "staff", "treasurer", "president", "faculty-in-charge", "associate-dean"]}>
                <EventDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster position="top-center" reverseOrder={false} /> {/* Render the Toaster */}
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
