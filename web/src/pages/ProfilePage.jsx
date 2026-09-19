import { useState } from 'react';
import { Edit2, LogOut, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { avatarColor } from '../utils/dateUtils';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  const handleEditClick = () => {
    setEditName(user?.full_name || '');
    setIsEditing(true);
  };

  const handleSaveName = async () => {
    if (editName.trim() !== '' && editName.trim() !== user?.full_name) {
      const res = await updateProfile(editName.trim());
      if (res.success) {
        setIsEditing(false);
      } else {
        alert(res.error || 'Failed to update name');
      }
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div className="profile-page animate-fade-in">
      <h2 className="page-title">My Profile</h2>
      
      <div className="profile-card">
        <div className="profile-avatar-large" style={{ background: avatarColor(user?.full_name || 'U') }}>
          {(user?.full_name || 'U').charAt(0).toUpperCase()}
        </div>

        <div className="profile-details">
          {/* Name Row */}
          <div className="profile-row">
            <div className="profile-row-content">
              <span className="profile-label">Name</span>
              {isEditing ? (
                <div className="profile-edit-inline">
                  <input
                    type="text"
                    className="profile-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button className="btn-primary btn-sm" onClick={handleSaveName}>Save</button>
                  <button className="btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              ) : (
                <div className="profile-value">
                  <User size={18} className="text-dim" />
                  <span className="value-text">{user?.full_name}</span>
                  <button className="edit-icon-btn" onClick={handleEditClick} title="Edit Name">
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Email Row */}
          <div className="profile-row">
            <div className="profile-row-content">
              <span className="profile-label">Email</span>
              <div className="profile-value">
                <Mail size={18} className="text-dim" />
                <span className="value-text text-dim">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Row */}
        <div className="profile-logout-section">
          <p className="logout-text">Want to switch accounts?</p>
          <button className="btn-danger-outline" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
