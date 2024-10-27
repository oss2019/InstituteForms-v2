import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Pages/Home/Home.jsx';
import Security from './Pages/Security/Security.jsx';
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute.jsx';
import StudentDashboard from './Pages/Student DashBoard/StudentDashboard.jsx';
import WardenDashboard from './Pages/WardenDashboard/WardenDashboard.jsx';

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
          path="/warden" 
          element={
            <ProtectedRoute requiredRole="warden">
              <WardenDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/security" 
          element={
            <ProtectedRoute requiredRole="security">
              <Security />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
