import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../modules/dashboard/Dashboard";
import Clients from "../modules/clients/Clients";
import MasterData from "../modules/master-data/MasterData";
import BulkUpload from "../modules/bulk-upload/BulkUpload";
import Input from "../modules/input/Input";
import Schedules from "../modules/schedules/Schedules";
import JournalEntries from "../modules/journal-entries/JournalEntries";
import Exports from "../modules/exports/Exports";
import Workpapers from "../modules/workpapers/Workpapers";
import Login from "../modules/auth/Login";
import { useAppState } from "../context/AppContext";

export default function AppRoutes() {
  const { state } = useAppState();

  if (!state.isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/bulk-upload" element={<BulkUpload />} />
          <Route path="/input" element={<Input />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/journal-entries" element={<JournalEntries />} />
          <Route path="/exports" element={<Exports />} />
          <Route path="/workpapers" element={<Workpapers />} />
          {/* Catch all route redirects to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}