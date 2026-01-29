import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoaderSpinner from "./LoaderSpinner";

export default function AdminRoute() {
  const { user, loading } = useAuth();

  // still checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border rounded-2xl shadow-sm w-full max-w-md">
          <LoaderSpinner label="Checking admin access…" />
        </div>
      </div>
    );
  }

  // not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // logged in but not admin
  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // admin is allowed
  return <Outlet />;
}
