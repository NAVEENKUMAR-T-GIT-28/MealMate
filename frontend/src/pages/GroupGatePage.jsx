import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Hash, ArrowRight } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import './GroupGatePage.css';

export default function GroupGatePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { createGroup, joinGroup } = useGroup();
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!groupName.trim()) return;
    try {
      await createGroup(groupName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!inviteCode.trim()) return;
    try {
      await joinGroup(inviteCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join group');
    }
  };

  return (
    <div className="gate-page">
      <div className="gate-container animate-scale-in">
        <div className="gate-header">
          <span className="gate-icon">🍲</span>
          <h1>Get Started</h1>
          <p>Create a new group or join an existing one with an invite code.</p>
        </div>

        {!mode && (
          <div className="gate-choices">
            <button className="gate-choice" onClick={() => setMode('create')}>
              <div className="gate-choice-icon create">
                <Plus size={28} />
              </div>
              <h3>Create a Group</h3>
              <p>Start a new PG/Mess group and invite members</p>
              <ArrowRight size={18} className="gate-choice-arrow" />
            </button>

            <button className="gate-choice" onClick={() => setMode('join')}>
              <div className="gate-choice-icon join">
                <UserPlus size={28} />
              </div>
              <h3>Join a Group</h3>
              <p>Enter an invite code to join an existing group</p>
              <ArrowRight size={18} className="gate-choice-arrow" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="gate-form animate-fade-in-up">
            <h2>Create Group</h2>
            {error && <div className="auth-error" style={{marginBottom: '1rem', color: 'var(--color-danger)'}}>{error}</div>}
            <div className="input-group">
              <Hash size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Group name (e.g., Sunshine PG)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="gate-form-actions">
              <button type="button" className="btn-secondary" onClick={() => setMode(null)}>
                Back
              </button>
              <button type="submit" className="btn-primary">
                <Plus size={18} />
                Create Group
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="gate-form animate-fade-in-up">
            <h2>Join Group</h2>
            {error && <div className="auth-error" style={{marginBottom: '1rem', color: 'var(--color-danger)'}}>{error}</div>}
            <div className="input-group">
              <Hash size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Enter invite code (e.g., SUN247)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
                required
                style={{ letterSpacing: '4px', fontWeight: 700, textAlign: 'center' }}
              />
            </div>
            <div className="gate-form-actions">
              <button type="button" className="btn-secondary" onClick={() => setMode(null)}>
                Back
              </button>
              <button type="submit" className="btn-primary">
                <UserPlus size={18} />
                Join Group
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
