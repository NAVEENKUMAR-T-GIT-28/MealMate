import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, BarChart3, Clock, Settings, LayoutDashboard, Users, LogOut } from 'lucide-react';
import GroupSwitcher from './GroupSwitcher';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { avatarColor } from '../utils/dateUtils';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Today' },
  { to: '/attendance', icon: CalendarDays, label: 'Attendance' },
  { to: '/summary', icon: BarChart3, label: 'Summary' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isAdmin } = useGroup();
  const location = useLocation();

  return (
    <div className="layout">
      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🍲</span>
            <span className="logo-text">MealMate</span>
          </div>
          <span className="logo-version">v2.0</span>
        </div>

        <div className="sidebar-group">
          <GroupSwitcher />
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/group-settings"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Users size={20} />
              <span>Group</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div
              className="sidebar-user-avatar"
              style={{ background: avatarColor(user?.full_name || 'U') }}
            >
              {(user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.full_name}</span>
              <span className="sidebar-user-role">
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="main-content">
        {/* Mobile header */}
        <header className="mobile-header">
          <div className="mobile-header-left">
            <span className="logo-icon-sm">🍲</span>
            <GroupSwitcher />
          </div>
          <div
            className="mobile-avatar"
            style={{ background: avatarColor(user?.full_name || 'U') }}
          >
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ────────────────────── */}
      <nav className="bottom-bar">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `bottom-tab ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
