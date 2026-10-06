import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Database,
  UploadCloud,
  Keyboard,
  Calendar,
  BookOpen,
  Download,
  Files,
  LogOut,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "../../context/AppContext";

const Sidebar = () => {
  const location = useLocation();
  const { state, dispatch } = useAppState();

  const navItems = [
    { path: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { path: "/clients", icon: <Users size={18} />, label: "Clients" },
    { path: "/master-data", icon: <Database size={18} />, label: "Master Data" },
    { path: "/bulk-upload", icon: <UploadCloud size={18} />, label: "Bulk Upload" },
    { path: "/input", icon: <Keyboard size={18} />, label: "Input" },
    { path: "/schedules", icon: <Calendar size={18} />, label: "Schedules" },
    { path: "/journal-entries", icon: <BookOpen size={18} />, label: "Journal Entries" },
    { path: "/exports", icon: <Download size={18} />, label: "Exports" },
    { path: "/workpapers", icon: <Files size={18} />, label: "Workpapers" },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
    toast.success('Successfully logged out');
  };

  const handleLaunchExcel = async () => {
    const toastId = toast.loading("Launching Excel Add-in...");
    try {
      const response = await fetch("http://localhost:8000/api/launch-excel", {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Excel Add-in launch triggered!", { id: toastId });
      } else {
        toast.error("Failed to launch Excel Add-in (server error)", { id: toastId });
      }
    } catch (error) {
      console.error("Error launching Excel Add-in:", error);
      toast.error("Failed to connect to backend server. Make sure Backend is running!", { id: toastId });
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">FA</div>
        <div>
          <h2>FinAccrual</h2>
          <p>Accounting workspace</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path || (item.path === '/master-data' && location.pathname === '/class-data') ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="profile-avatar">{state.user?.name ? state.user.name.charAt(0) : 'A'}</div>
            <div className="plan-info">
              <span className="value" style={{ fontSize: '0.85rem' }}>{state.user?.name || 'Admin'}</span>
              <span className="label" style={{ textTransform: 'none' }}>{state.user?.email || 'admin@demo.com'}</span>
            </div>
          </div>
          <button
  onClick={handleLaunchExcel}
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "10px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    transition: "background 0.2s",
  }}
  onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
  onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
>
  <FileSpreadsheet size={16} />
  Add In
</button>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;