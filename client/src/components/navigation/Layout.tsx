import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <NavLink to="/dashboard" className="logo">
            Qalam
          </NavLink>
          <nav className="nav">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Home
            </NavLink>
            <NavLink to="/surahs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Browse
            </NavLink>
            <NavLink to="/practice" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Practice
            </NavLink>
            <NavLink to="/progress" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Progress
            </NavLink>
          </nav>
          <div className="header-actions">
            <span className="user-name">{user?.name}</span>
            <NavLink to="/settings" className="settings-link">
              Settings
            </NavLink>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
