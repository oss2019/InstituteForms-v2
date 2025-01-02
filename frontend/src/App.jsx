import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home/Home.jsx";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute.jsx";
import StudentDashboard from "./Pages/Student DashBoard/StudentDashboard.jsx";
import StaffDashboard from "./Pages/StaffDashboard/StaffDashboard.jsx";
import { Toaster } from "react-hot-toast"; // Import the Toaster component
import PageNotFound from "./Pages/Page Not Found/PageNotFound.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google"; // Import GoogleOAuthProvider

function App() {
  const GOOGLE_CLIENT_ID =
    "126283465709-v64j607pjhd396kjsrn7qprhk2dns9ou.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/club-secretary"
            element={
              <ProtectedRoute requiredRole="club-secretary">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
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
