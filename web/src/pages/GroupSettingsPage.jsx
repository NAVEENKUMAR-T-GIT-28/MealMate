import { useState } from 'react';
import { Copy, RefreshCw, UserMinus, UserPlus, Shield, Edit2, Power, Trash2, Check, X, Clock } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { groupsApi } from '../api/groups';
import { avatarColor, formatDateDisplay } from '../utils/dateUtils';
import './GroupSettingsPage.css';

export default function GroupSettingsPage() {
  const { currentGroup, allMembers, isAdmin, refreshMembers, admitMember } = useGroup();
  const { user, updateProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const pendingMembers = allMembers.filter(m => m.role === 'pending');
  const regularMembers = allMembers.filter(m => m.role !== 'pending');

  const [modalConfig, setModalConfig] = useState(null);
  const [modalInput, setModalInput] = useState('');

  const closeModal = () => {
    setModalConfig(null);
    setModalInput('');
  };

  const handleEditName = (currentName) => {
    setModalInput(currentName);
    setModalConfig({
      type: 'edit_name',
      title: 'Edit Your Name',
      confirmText: 'Save',
      originalName: currentName
    });
  };

  const handleToggleStatus = (memberId, currentStatus) => {
    setModalConfig({
      type: 'confirm',
      action: 'toggle_status',
      memberId,
      currentStatus,
      title: 'Update Status',
      message: `Are you sure you want to mark this member as ${currentStatus ? 'inactive' : 'active'}?`,
      confirmText: currentStatus ? 'Make Inactive' : 'Make Active',
      isDanger: currentStatus
    });
  };

  const handleAdmitMember = (memberId) => {
    setModalConfig({
      type: 'confirm',
      action: 'admit_member',
      memberId,
      title: 'Admit Member',
      message: 'Are you sure you want to allow this user into the group?',
      confirmText: 'Allow',
      isDanger: false
    });
  };

  const handleRemoveMember = (memberId, isDeny = false) => {
    setModalConfig({
      type: 'confirm',
      action: 'remove_member',
      memberId,
      title: isDeny ? 'Deny Request' : 'Remove Member',
      message: isDeny 
        ? 'Are you sure you want to deny this request?' 
        : 'Are you sure you want to completely remove this member from the group? This action cannot be undone.',
      confirmText: isDeny ? 'Deny' : 'Remove',
      isDanger: true
    });
  };

  const confirmModalAction = async () => {
    if (!modalConfig) return;

    if (modalConfig.type === 'edit_name') {
      if (modalInput.trim() !== "" && modalInput !== modalConfig.originalName) {
        const res = await updateProfile(modalInput.trim());
        if (res.success) {
          refreshMembers();
          closeModal();
        } else {
          alert(res.error || "Failed to update name");
        }
      } else {
        closeModal();
      }
    } else if (modalConfig.action === 'toggle_status') {
      try {
        await groupsApi.updateMemberStatus(currentGroup.id, modalConfig.memberId, !modalConfig.currentStatus);
        refreshMembers();
        closeModal();
      } catch (err) {
        alert("Failed to update status");
      }
    } else if (modalConfig.action === 'remove_member') {
      try {
        await groupsApi.removeMember(currentGroup.id, modalConfig.memberId);
        refreshMembers();
        closeModal();
      } catch (err) {
        alert("Failed to remove member");
      }
    } else if (modalConfig.action === 'admit_member') {
      try {
        await admitMember(modalConfig.memberId);
        closeModal();
      } catch (err) {
        alert("Failed to admit member");
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentGroup?.invite_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/groups?code=${currentGroup?.invite_code}`;
    navigator.clipboard?.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const activeCount = regularMembers.filter(m => m.is_active).length;

  return (
    <div className="group-settings-page">
      {/* Group Header */}
      <div className="group-info-card animate-fade-in">
        <div className="group-info-header">
          <img src="/favicon.png" alt="MealMate Logo" className="group-info-icon-img" />
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
              {copied ? 'Copied!' : 'Code'}
            </button>
            <button className="invite-btn" onClick={handleCopyLink} title="Copy invite link">
              <Copy size={16} />
              {linkCopied ? 'Copied!' : 'Link'}
            </button>
          </div>
          <p className="invite-hint">
            Share this code with others to let them join your group
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="group-stats animate-fade-in-down delay-1">
        <div className="group-stat">
          <span className="group-stat-value">{regularMembers.length}</span>
          <span className="group-stat-label">Total</span>
        </div>
        <div className="group-stat">
          <span className="group-stat-value" style={{ color: 'var(--primary)' }}>{activeCount}</span>
          <span className="group-stat-label">Active</span>
        </div>
        <div className="group-stat">
          <span className="group-stat-value" style={{ color: 'var(--warning)' }}>{regularMembers.length - activeCount}</span>
          <span className="group-stat-label">Inactive</span>
        </div>
      </div>

      {isAdmin && pendingMembers.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="members-heading animate-fade-in-down delay-2" style={{ color: 'var(--warning)' }}>
            <Clock size={18} />
            Pending Requests ({pendingMembers.length})
          </h3>
          <div className="group-members-list">
            {pendingMembers.map((member, idx) => (
              <div
                key={member.id}
                className="group-member-card animate-fade-in-right"
                style={{ animationDelay: `${(idx + 1) * 50}ms`, borderLeft: '4px solid var(--warning)' }}
              >
                <div className="group-member-left">
                  <div
                    className="group-member-avatar"
                    style={{ background: 'var(--text-dim)', color: 'var(--text)' }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="group-member-info">
                    <span className="group-member-name">
                      {member.name}
                    </span>
                    <span className="group-member-joined">
                      Requested {formatDateDisplay(member.joined_at)}
                    </span>
                  </div>
                </div>
                <div className="group-member-right">
                  <div className="member-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleAdmitMember(member.user_id)}
                    >
                      <Check size={16} /> Allow
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                      onClick={() => handleRemoveMember(member.user_id, true)}
                    >
                      <X size={16} /> Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <h3 className="members-heading animate-fade-in-down delay-2">
        <UserPlus size={18} />
        Members ({regularMembers.length})
      </h3>

      <div className="group-members-list">
        {regularMembers.map((member, idx) => (
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

              <div className="member-actions">
                {member.user_id === user?.id && (
                  <button className="action-btn edit-btn" onClick={() => handleEditName(member.name)} title="Edit your name">
                    <Edit2 size={16} />
                  </button>
                )}
                
                {isAdmin && member.user_id !== user?.id && (
                  <>
                    <button 
                      className={`action-btn ${member.is_active ? 'power-btn' : 'power-btn-inactive'}`} 
                      onClick={() => handleToggleStatus(member.user_id, member.is_active)}
                      title={member.is_active ? "Make Inactive" : "Make Active"}
                    >
                      <Power size={16} />
                    </button>
                    <button className="action-btn remove-btn" onClick={() => handleRemoveMember(member.user_id)} title="Remove from group">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Modal */}
      {modalConfig && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{modalConfig.title}</h3>
            
            {modalConfig.type === 'edit_name' ? (
              <input
                type="text"
                className="modal-input"
                value={modalInput}
                onChange={e => setModalInput(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmModalAction()}
              />
            ) : (
              <p className="modal-body">{modalConfig.message}</p>
            )}

            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button 
                className={`modal-btn ${modalConfig.isDanger ? 'modal-btn-danger' : 'modal-btn-confirm'}`}
                onClick={confirmModalAction}
              >
                {modalConfig.confirmText || 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
