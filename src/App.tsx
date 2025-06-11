// src/App.tsx
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Login from "./pages/Login";
import MyTickets from "./pages/MyTickets";
import CreateTicketPage from "./pages/CreateTicket";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { AuthWrapper } from "./pages/AuthWrapper";
import WorkerDashboard from "./pages/WorkerDashboard";

const ProtectedRoute = () => {
  return (
    <AuthWrapper>
      <Outlet />
    </AuthWrapper>
  );
};

const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
            <Route path="/worker-dashboard/*" element={<WorkerDashboard />} /> {/* New */}
            <Route path="/my-tickets/*" element={<MyTickets />} />
            <Route path="/create-ticket" element={<CreateTicketPage />} />
            <Route path="/" element={<Navigate to="/my-tickets" replace />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;