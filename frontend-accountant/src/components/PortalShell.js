'use client';
import { useState, useEffect } from 'react';
import Login from './Login';
import { api } from '../utils/api';

export default function PortalShell({ role, children, activeTab, setActiveTab, tabs }) {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check auth
    const currentUser = api.getCurrentUser();
    const token = localStorage.getItem('cmms_token');
    
    if (currentUser && token && currentUser.role === role) {
      setUser(currentUser);
      fetchNotifications();
    } else {
      api.logout();
      setUser(null);
    }
    setCheckingAuth(false);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.success) {
        setUnreadCount(0);
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="loader-container">
        <span className="loader"></span>
        <style jsx>{`
          .loader-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: hsl(224, 71%, 4%);
          }
          .loader {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(255,255,255,0.1);
            border-radius: 50%;
            border-top-color: hsl(35, 100%, 52%);
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Login role={role} onLoginSuccess={(u) => { setUser(u); fetchNotifications(); }} />;
  }

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Sidebar */}
      <aside className="sidebar glass">
        <div className="sidebar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
          </svg>
          <span className="brand-text">THA CMMS</span>
        </div>

        <div className="user-profile-widget">
          <div className="avatar">
            {user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()}
          </div>
          <div className="user-info">
            <h4 className="user-name">{user.fullName || user.username}</h4>
            <span className="user-role">{user.role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="main-wrapper">
        <header className="header glass">
          <div className="header-title">
            <h2>{tabs.find(t => t.id === activeTab)?.label}</h2>
          </div>
          
          <div className="header-actions">
            {/* Notification Bell */}
            <div className="notification-bell-container">
              <button 
                className="btn-icon" 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown glass-card">
                  <div className="notifications-header">
                    <h4>Recent Notifications</h4>
                    <button className="btn-text" onClick={handleMarkAllRead}>Mark all read</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notifications">No new notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`notification-item ${n.isRead ? '' : 'unread'}`}>
                          <div className="notification-dot"></div>
                          <div className="notification-content">
                            <h5>{n.title}</h5>
                            <p>{n.message}</p>
                            <span className="notification-time">{new Date(n.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="header-profile">
              <span className="welcome-text">Hello, <strong>{user.fullName || user.username}</strong></span>
            </div>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .loader-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(224, 71%, 4%);
        }

        .main-wrapper {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .header {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          border-bottom: 1px solid hsl(var(--border));
          z-index: 100;
          flex-shrink: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .btn-icon {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: hsl(var(--primary));
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: hsl(var(--destructive));
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid hsl(var(--background));
        }

        .notification-bell-container {
          position: relative;
        }

        .notifications-dropdown {
          position: absolute;
          top: 55px;
          right: 0;
          width: 320px;
          z-index: 1000;
          padding: 15px;
          border-radius: var(--radius);
        }

        .notifications-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 10px;
          margin-bottom: 10px;
        }

        .notifications-header h4 {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .btn-text {
          background: none;
          border: none;
          color: hsl(var(--primary));
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
        }

        .notifications-list {
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-notifications {
          text-align: center;
          color: hsl(var(--muted-foreground));
          padding: 20px 0;
          font-size: 0.85rem;
        }

        .notification-item {
          display: flex;
          gap: 10px;
          padding: 8px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .notification-item.unread {
          background: rgba(245, 158, 11, 0.05);
        }

        .notification-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: hsl(var(--primary));
          margin-top: 5px;
          flex-shrink: 0;
        }

        .notification-content h5 {
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .notification-content p {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          line-height: 1.3;
          margin-bottom: 4px;
        }

        .notification-time {
          font-size: 0.65rem;
          color: hsl(var(--muted-foreground));
        }

        .welcome-text {
          font-size: 0.9rem;
        }

        .sidebar-brand {
          height: 70px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px;
          border-bottom: 1px solid hsl(var(--border));
          color: hsl(var(--primary));
        }

        .brand-text {
          font-weight: 700;
          font-size: 1.15rem;
          letter-spacing: -0.01em;
          color: #fff;
        }

        .user-profile-widget {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid hsl(var(--border));
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: hsl(var(--primary));
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
        }

        .user-role {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
        }

        .sidebar-nav {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-grow: 1;
          overflow-y: auto;
        }

        .nav-item {
          background: none;
          border: 1px solid transparent;
          color: hsl(var(--muted-foreground));
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }

        .nav-item.active {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.15);
          color: hsl(var(--primary));
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-footer {
          padding: 20px 24px;
          border-top: 1px solid hsl(var(--border));
        }

        .btn-logout {
          background: none;
          border: none;
          color: hsl(var(--muted-foreground));
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          width: 100%;
          transition: color 0.2s ease;
        }

        .btn-logout:hover {
          color: hsl(var(--destructive));
        }
      `}</style>
    </div>
  );
}
