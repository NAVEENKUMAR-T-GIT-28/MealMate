import { NavLink, Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { CalendarDays, BarChart3, Clock, Settings, LayoutDashboard, Users, User, LogOut } from 'lucide-react';
import GroupSwitcher from './GroupSwitcher';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { avatarColor } from '../utils/dateUtils';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Today' },
  { to: '/summary', icon: BarChart3, label: 'Summary' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function PendingApprovalView({ groupName, onLogout, onCancel }) {
  return (
    <div 
      className="animate-fade-in" 
      style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem',
        background: 'var(--bg-body)' 
      }}
    >
      <div style={{ maxWidth: '400px', width: '100%', background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
        <img src="/favicon.png" alt="MealMate Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 1rem', display: 'block' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Waiting for Approval</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Your request to join <strong>{groupName}</strong> has been sent to the admin. You will gain access to the dashboard once they admit you.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onLogout} style={{ width: '100%' }}>
            Log Out
          </button>
          <button 
            onClick={onCancel}
            style={{ width: '100%', background: 'transparent', border: '1px solid transparent', color: 'var(--color-danger)', padding: '0.75rem', cursor: 'pointer', fontWeight: 500, borderRadius: '8px' }}
          >
            Cancel Request
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { isAdmin, groups, currentGroup, loading, isPending, cancelRequest } = useGroup();
  const location = useLocation();

  if (loading) {
    return (
      <div className="layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
        <div className="text-[var(--color-text-secondary)]">Loading your groups...</div>
      </div>
    );
  }

  if (groups.length === 0) {
    return <Navigate to="/groups" replace />;
  }

  if (isPending) {
    return (
      <PendingApprovalView 
        groupName={currentGroup?.name || 'the group'} 
        onLogout={logout} 
        onCancel={cancelRequest} 
      />
    );
  }

  return (
    <div className="layout">
      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/favicon.png" alt="MealMate Logo" className="logo-icon-img" />
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
          <NavLink
            to="/group-settings"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Users size={20} />
            <span>Group</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-user" style={{ textDecoration: 'none', cursor: 'pointer' }}>
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
          </Link>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="main-content">
        {/* Mobile header */}
        <header className="mobile-header">
          <div className="mobile-header-left">
            <img src="/favicon.png" alt="MealMate Logo" className="logo-icon-sm-img" />
            <GroupSwitcher />
          </div>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div
              className="mobile-avatar"
              style={{ background: avatarColor(user?.full_name || 'U') }}
            >
              {(user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
          </Link>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ────────────────────── */}
      <nav className="bottom-bar">
        {NAV_ITEMS.filter(item => item.to !== '/profile').map(item => (
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
        <NavLink
          to="/group-settings"
          className={({ isActive }) =>
            `bottom-tab ${isActive ? 'active' : ''}`
          }
        >
          <Users size={22} />
          <span>Group</span>
        </NavLink>
      </nav>
    </div>
  );
}
