import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import AdminPortal from "@/pages/AdminPortal";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import StudentPortal from "@/pages/StudentPortal";
import VerifyCertificate from "@/pages/VerifyCertificate";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Index />
            </PageTransition>
          }
        />
        <Route
          path="/auth"
          element={
            <PageTransition>
              <Auth />
            </PageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          }
        />
        <Route
          path="/super-admin"
          element={
            <PageTransition>
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <ProtectedRoute requiredRole="admin">
                <AdminPortal />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/student"
          element={
            <PageTransition>
              <ProtectedRoute requiredRole="student">
                <StudentPortal />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/verify"
          element={
            <PageTransition>
              <VerifyCertificate />
            </PageTransition>
          }
        />
        <Route
          path="/unauthorized"
          element={
            <PageTransition>
              <Unauthorized />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
