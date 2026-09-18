import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { Plus, UserPlus, Hash, ArrowRight } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import './GroupGatePage.css';

export default function GroupGatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code');

  const [mode, setMode] = useState(codeParam ? 'join' : null); // 'create' | 'join'
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState(codeParam || '');
  
  const [morningPrice, setMorningPrice] = useState('');
  const [afternoonPrice, setAfternoonPrice] = useState('');
  const [nightPrice, setNightPrice] = useState('');

  const { createGroup, joinGroup, groups, loading } = useGroup();
  const [error, setError] = useState('');

  if (!loading && groups && groups.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!groupName.trim()) return;
    try {
      const prices = {
        morning: Number(morningPrice) || 0,
        afternoon: Number(afternoonPrice) || 0,
        night: Number(nightPrice) || 0,
      };
      await createGroup(groupName, prices);
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
          <img src="/favicon.png" alt="MealMate Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '16px' }} />
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
            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              Initial Meal Prices (₹)
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                <span className="input-icon" style={{ fontSize: '14px' }}>☀️</span>
                <input
                  type="number"
                  placeholder="Morning"
                  value={morningPrice}
                  onChange={(e) => setMorningPrice(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                  required
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                <span className="input-icon" style={{ fontSize: '14px' }}>🌤️</span>
                <input
                  type="number"
                  placeholder="Afternoon"
                  value={afternoonPrice}
                  onChange={(e) => setAfternoonPrice(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                  required
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                <span className="input-icon" style={{ fontSize: '14px' }}>🌙</span>
                <input
                  type="number"
                  placeholder="Night"
                  value={nightPrice}
                  onChange={(e) => setNightPrice(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                  required
                />
              </div>
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
