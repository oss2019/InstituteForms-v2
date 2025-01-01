// src/Components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token');
    
    // Check for a condition to bypass authentication, e.g., a local development flag
    const isDevMode = false;  // Set this to `true` temporarily during development

    // Decode the token to get user info (you may use a library like jwt-decode)
    const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null; // Basic decoding

    // Check if the user is authenticated and has the required role
    const isAuthenticated = !!token;
    const hasRequiredRole = decodedToken && decodedToken.role === requiredRole;

    if (isDevMode) {
        // If in dev mode, allow access without authentication checks
        return children;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }

    if (requiredRole && !hasRequiredRole) {
        return <Navigate to="/" />; // Redirect if user doesn't have the right role
    }

    return children; // Render the protected component
};

export default ProtectedRoute;
