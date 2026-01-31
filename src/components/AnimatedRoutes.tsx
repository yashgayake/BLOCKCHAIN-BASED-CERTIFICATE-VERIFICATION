import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import Index from "@/pages/Index";
import AdminPortal from "@/pages/AdminPortal";
import StudentPortal from "@/pages/StudentPortal";
import VerifyCertificate from "@/pages/VerifyCertificate";
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
          path="/admin"
          element={
            <PageTransition>
              <AdminPortal />
            </PageTransition>
          }
        />
        <Route
          path="/student"
          element={
            <PageTransition>
              <StudentPortal />
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
