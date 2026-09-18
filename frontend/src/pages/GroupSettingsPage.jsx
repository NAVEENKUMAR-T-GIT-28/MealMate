import { useState } from 'react';
import { Copy, RefreshCw, UserMinus, UserPlus, Shield } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { avatarColor, formatDateDisplay } from '../utils/dateUtils';
import './GroupSettingsPage.css';

export default function GroupSettingsPage() {
  const { currentGroup, allMembers, isAdmin } = useGroup();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentGroup?.invite_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCount = allMembers.filter(m => m.is_active).length;

  return (
    <div className="group-settings-page">
      {/* Group Header */}
      <div className="group-info-card animate-fade-in">
        <div className="group-info-header">
          <div className="group-info-icon">🍲</div>
          <div>
            <h2 className="group-info-name">{currentGroup?.name}</h2>
            <p className="group-info-meta">
              Created {formatDateDisplay(currentGroup?.created_at || '')}
            </p>
          </div>
        </div>

        {/* Invite Code */}
        <div className="invite-section">
          <label className="invite-label">Invite Code</label>
          <div className="invite-code-row">
            <div className="invite-code">{currentGroup?.invite_code}</div>
            <button className="invite-btn" onClick={handleCopyCode} title="Copy code">
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {isAdmin && (
              <button
                className="invite-btn regenerate"
                onClick={() => alert('Regenerate — will work in Phase 3')}
                title="Regenerate code"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
          <p className="invite-hint">
            Share this code with others to let them join your group
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="group-stats animate-fade-in-down delay-1">
        <div className="group-stat">
          <span className="group-stat-value">{allMembers.length}</span>
          <span className="group-stat-label">Total</span>
        </div>
        <div className="group-stat">
          <span className="group-stat-value" style={{ color: 'var(--primary)' }}>{activeCount}</span>
          <span className="group-stat-label">Active</span>
        </div>
        <div className="group-stat">
          <span className="group-stat-value" style={{ color: 'var(--warning)' }}>{allMembers.length - activeCount}</span>
          <span className="group-stat-label">Inactive</span>
        </div>
      </div>

      {/* Members List */}
      <h3 className="members-heading animate-fade-in-down delay-2">
        <UserPlus size={18} />
        Members ({allMembers.length})
      </h3>

      <div className="group-members-list">
        {allMembers.map((member, idx) => (
          <div
            key={member.id}
            className={`group-member-card ${!member.is_active ? 'inactive' : ''} animate-fade-in-right`}
            style={{ animationDelay: `${(idx + 3) * 50}ms` }}
          >
            <div className="group-member-left">
              <div
                className="group-member-avatar"
                style={{ background: member.is_active ? avatarColor(member.name) : 'var(--text-dim)' }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="group-member-info">
                <span className={`group-member-name ${!member.is_active ? 'strikethrough' : ''}`}>
                  {member.name}
                </span>
                <span className="group-member-joined">
                  Joined {formatDateDisplay(member.joined_at)}
                </span>
              </div>
            </div>
            <div className="group-member-right">
              {member.role === 'admin' && (
                <span className="badge badge-admin">
                  <Shield size={12} />
                  Admin
                </span>
              )}
              <span className={`badge ${member.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
