import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRoles }) => {
    const token = localStorage.getItem('token');
    
    // Check for a condition to bypass authentication, e.g., a local development flag
    const isDevMode = true;  // Set this to `true` temporarily during development

    // Decode the token to get user info (you may use a library like jwt-decode)
    const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null; // Basic decoding

    // Check if the user is authenticated and has one of the required roles
    const isAuthenticated = !!token;
    const hasRequiredRole = decodedToken && requiredRoles.includes(decodedToken.role);

    if (isDevMode) {
        // If in dev mode, allow access without authentication checks
        return children;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }

    if (requiredRoles && !hasRequiredRole) {
        return <Navigate to="/" />; // Redirect if user doesn't have one of the right roles
    }

    return children; // Render the protected component
};

export default ProtectedRoute;
