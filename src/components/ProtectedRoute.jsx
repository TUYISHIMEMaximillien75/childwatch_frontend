import { Navigate, Outlet } from "react-router-dom";
import { getDashboardRoute, getAuthRole, getAuthSubRole, isAuthenticated } from "../utils/authStorage";

export default function ProtectedRoute({ requiredRole }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const accountType = getAuthRole();   // "admin" | "user"
    const subRole     = getAuthSubRole(); // "Police" | "Hospital" | "Social Worker" | "Parent/Reporter" | null

    const allowed =
      requiredRole === "admin"
        ? accountType === "admin"
        : requiredRole === "user"
          ? accountType === "user"
          : accountType === "user" && subRole === requiredRole;

    if (!allowed) {
      return <Navigate to={getDashboardRoute()} replace />;
    }
  }

  return <Outlet />;
}
