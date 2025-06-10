import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthWrapper } from './pages/AuthWrapper';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MyTickets from './pages/MyTickets';
import NotFound from './pages/NotFound';
import CreateTicketPage from './pages/CreateTicket';



const queryClient = new QueryClient();

// Componente para rutas protegidas
const ProtectedRoute = () => {
  return (
    <AuthWrapper>
      <Outlet />
    </AuthWrapper>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
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