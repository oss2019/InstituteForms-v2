import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Pages/Home/Home.jsx';
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute.jsx';
import StudentDashboard from './Pages/Student DashBoard/StudentDashboard.jsx';
import StaffDashboard from './Pages/StaffDashboard/StaffDashboard.jsx';
import { Toaster } from 'react-hot-toast'; // Import the Toaster component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/student" 
          element={
            <ProtectedRoute requiredRole="student">
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
      </Routes>
      <Toaster position="top-center" reverseOrder={false} /> {/* Render the Toaster */}
    </Router>
  );
}

export default App;
