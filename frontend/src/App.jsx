import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home/Home.jsx";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute.jsx";
import StudentDashboard from "./Pages/Student DashBoard/StudentDashboard.jsx";
import StaffDashboard from "./Pages/Staff Dashboard/StaffDashboard.jsx";
import StudentPortal from "./Pages/Student Portal/StudentPortal.jsx";
import EventDetails from "./Pages/Event Details/EventDetails.jsx";
import { Toaster } from "react-hot-toast";
import PageNotFound from "./Pages/Page Not Found/PageNotFound.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

function App() {
  const GOOGLE_CLIENT_ID ="484697483733-aq5c7ugfot4i31o5clir2mhosonbuhnu.apps.googleusercontent.com";

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
              <ProtectedRoute requiredRoles={["general-secretary", "staff", "treasurer", "president", "ARSW", "associate-dean", "dean"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event-details/:id"
            element={
              <ProtectedRoute requiredRoles={["general-secretary", "staff", "treasurer", "president", "ARSW", "associate-dean", "dean"]}>
                <EventDetails />
              </ProtectedRoute>
            }
          />
          {/* ── Student welfare portal (nested routes handled inside StudentPortal) ── */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute requiredRoles={["student"]}>
                <StudentPortal />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster position="top-center" reverseOrder={false} />
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
