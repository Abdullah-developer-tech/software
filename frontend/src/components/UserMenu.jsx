import React, { useState, useEffect } from 'react';
import { getUser, destroySession } from '../lib/auth';

export default function UserMenu() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Client-side par user load karein safely
    const activeUser = getUser();
    setUser(activeUser);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    destroySession(); // Lib file se session delete aur redirect karega
  };

  if (!user) return null;

  return (
    <div className="user-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="user-menu-trigger"
        style={{
          background: 'none',
          border: 'none',
          color: '#030303',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>👤 {user.name || 'Account'}</span>
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div 
          className="user-dropdown-menu"
          style={{
            position: 'absolute',
            right: 0,
            top: '35px',
            backgroundColor: '#1e2640',
            border: '1px solid #2e3a5f',
            borderRadius: '8px',
            padding: '8px 0',
            minWidth: '150px',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #2e3a5f', fontSize: '12px', color: '#9ca3af' }}>
            Role: <strong style={{ color: '#5cb88f', textTransform: 'capitalize' }}>{user.role}</strong>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: '#f87171',
              padding: '10px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}