import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import MonthNavigator from '../components/MonthNavigator';
import { useGroup } from '../context/GroupContext';
import { summaryApi } from '../api/summary';
import { attendanceApi } from '../api/attendance';
import {
  currentMonthStr, formatMonth, getNextMonth, getPrevMonth,
  formatDateDisplay
} from '../utils/dateUtils';
import './MemberDetailPage.css';

export default function MemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { currentGroup, allMembers } = useGroup();
  const location = useLocation();
  const [month, setMonth] = useState(location.state?.month || currentMonthStr());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberSummary, setMemberSummary] = useState(null);
  const [monthAttendance, setMonthAttendance] = useState([]);

  const member = allMembers.find(m => m.user_id === Number(memberId));

  const fetchData = useCallback(async () => {
    if (!currentGroup || !member) return;
    try {
      setLoading(true);
      setError('');
      
      const [summaryData, attendanceData] = await Promise.all([
        summaryApi.getSummary(currentGroup.id, month),
        attendanceApi.getAttendanceForMonth(currentGroup.id, month, memberId)
      ]);
      
      const mSummary = summaryData.members.find(m => m.user_id === Number(memberId));
      setMemberSummary(mSummary || {
         morning_count: 0, afternoon_count: 0, night_count: 0,
         morning_cost: 0, afternoon_cost: 0, night_cost: 0, total_cost: 0
      });
      
      setMonthAttendance(attendanceData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [currentGroup, month, member, memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!member) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 64 }}>🤔</span>
        <h3>Member Not Found</h3>
        <button className="btn-secondary" onClick={() => navigate('/summary', { state: { month } })}>
          Back to Summary
        </button>
      </div>
    );
  }

  // Generate calendar days for the month
  const getDaysInMonth = (monthStr) => {
    const [year, m] = monthStr.split('-');
    const daysInMonth = new Date(year, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return `${monthStr}-${day}`;
    });
  };

  const monthDays = getDaysInMonth(month);

  return (
    <div className="member-detail-page">
      <div className="detail-header animate-fade-in">
        <button className="back-btn" onClick={() => navigate('/summary', { state: { month } })}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-info">
          <h2>{member.name}</h2>
          <span className="badge badge-active">{member.role}</span>
        </div>
      </div>

      <MonthNavigator
        label={formatMonth(month)}
        onPrev={() => setMonth(m => getPrevMonth(m))}
        onNext={() => setMonth(m => getNextMonth(m))}
        onReset={() => setMonth(currentMonthStr())}
      />
      
      {error && <div className="auth-error" style={{margin: '1rem', color: 'var(--color-danger)'}}>{error}</div>}

      {loading ? (
        <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">Loading details...</div>
      ) : (
        <>
          <div className="detail-stats animate-fade-in-down delay-1">
            <div className="stat-card" style={{ borderLeftColor: 'var(--morning)' }}>
              <span className="stat-emoji">☀️</span>
              <span className="stat-value">{memberSummary?.morning_count || 0}</span>
              <span className="stat-label">₹{memberSummary?.morning_cost || 0}</span>
            </div>
            <div className="stat-card" style={{ borderLeftColor: 'var(--afternoon)' }}>
              <span className="stat-emoji">🌤️</span>
              <span className="stat-value">{memberSummary?.afternoon_count || 0}</span>
              <span className="stat-label">₹{memberSummary?.afternoon_cost || 0}</span>
            </div>
            <div className="stat-card" style={{ borderLeftColor: 'var(--night)' }}>
              <span className="stat-emoji">🌙</span>
              <span className="stat-value">{memberSummary?.night_count || 0}</span>
              <span className="stat-label">₹{memberSummary?.night_cost || 0}</span>
            </div>
            <div className="stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
              <span className="stat-label">Total</span>
              <span className="stat-value primary">₹{memberSummary?.total_cost || 0}</span>
            </div>
          </div>

          <div className="detail-calendar animate-fade-in-up delay-2">
            <div className="detail-calendar-header">
              <span>Date</span>
              <span>☀️ M</span>
              <span>🌤️ A</span>
              <span>🌙 N</span>
            </div>
            <div className="detail-calendar-body">
              {monthDays.map(dateStr => {
                const dayData = monthAttendance.find(a => a.date === dateStr);
                const d = new Date(dateStr);
                const isFuture = d > new Date();

                return (
                  <div key={dateStr} className={`detail-calendar-row ${isFuture ? 'future' : ''}`}>
                    <div className="detail-date">{formatDateDisplay(dateStr)}</div>
                    <div className="detail-meal">
                      {dayData?.morning ? <span className="meal-dot morning"></span> : '-'}
                    </div>
                    <div className="detail-meal">
                      {dayData?.afternoon ? <span className="meal-dot afternoon"></span> : '-'}
                    </div>
                    <div className="detail-meal">
                      {dayData?.night ? <span className="meal-dot night"></span> : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
