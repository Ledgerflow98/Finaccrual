const Header = () => {
  return (
    <header className="admin-header">
      <div className="header-left">
        <span>LOCAL - mock connector mode</span>
      </div>
      <div className="header-right">
        <div className="header-user">
          <span className="status-dot"></span>
          <span>Local</span>
        </div>
        <select className="header-select">
          <option>CL002</option>
        </select>
        <select className="header-select">
          <option>QBO Pro</option>
        </select>
        <div className="header-user">
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
};

export default Header;