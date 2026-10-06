import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import "../styles/admin.css"; // Implemented premium CSS

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Toaster position="top-right" richColors />
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;