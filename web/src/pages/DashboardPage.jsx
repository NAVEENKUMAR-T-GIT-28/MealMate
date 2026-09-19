import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MemberRow from '../components/MemberRow';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useAttendanceQuery } from '../hooks/useAttendanceQuery';
import { usePricesQuery } from '../hooks/usePricesQuery';
import { useToggleAttendance } from '../hooks/useToggleAttendance';
import { todayStr, addDaysStr, formatDateDisplay } from '../utils/dateUtils';
import './DashboardPage.css';

export default function DashboardPage() {
  const { currentGroup, activeMembers } = useGroup();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const groupId = currentGroup?.id;

  // Server-state via TanStack Query
  const {
    data: rawEntries = [],
    isLoading,
    error: queryError,
  } = useAttendanceQuery(groupId, selectedDate);

  const { data: pricesData } = usePricesQuery(groupId);

  // Attendance mutation with optimistic updates
  const toggleMutation = useToggleAttendance(groupId, selectedDate);

  // Compute live total for the current user based on their attendance + effective prices
  const liveTotal = useMemo(() => {
    if (!pricesData || !rawEntries.length) return 0;
    const dateObj = new Date(selectedDate);
    let currentPrices = { morning: null, afternoon: null, night: null };
    for (const priceObj of pricesData) {
      if (new Date(priceObj.effective_from) <= dateObj) {
        if (currentPrices[priceObj.meal_type] === null) {
          currentPrices[priceObj.meal_type] = priceObj.price;
        }
      }
    }

    let total = 0;
    const myEntry = rawEntries.find(e => e.user_id === user.id);
    if (myEntry) {
      if (myEntry.morning) total += (currentPrices.morning || 0);
      if (myEntry.afternoon) total += (currentPrices.afternoon || 0);
      if (myEntry.night) total += (currentPrices.night || 0);
    }
    return total;
  }, [pricesData, rawEntries, selectedDate, user?.id]);

  const getMealState = useCallback((memberId) => {
    const entry = rawEntries.find(e => e.user_id === memberId);
    return {
      morning: entry?.morning || false,
      afternoon: entry?.afternoon || false,
      night: entry?.night || false,
    };
  }, [rawEntries]);

  const handleToggle = useCallback(async (memberId, meal) => {
    if (!currentGroup) return;
    toggleMutation.mutate(
      { mealType: meal, memberId, activeMembers },
      {
        onError: (err) => {
          alert(err.response?.data?.error || 'Failed to update attendance');
        },
      }
    );
  }, [currentGroup, toggleMutation, activeMembers]);

  // Compute live counts
  const liveCounts = { morning: 0, afternoon: 0, night: 0 };
  for (const entry of rawEntries) {
    if (entry.morning) liveCounts.morning++;
    if (entry.afternoon) liveCounts.afternoon++;
    if (entry.night) liveCounts.night++;
  }

  const isToday = selectedDate === todayStr();
  const error = queryError ? 'Failed to load dashboard data' : '';

  if (!currentGroup) return <div className="dashboard"><div className="empty-state">No group selected.</div></div>;

  return (
    <div className="dashboard">
      {/* Date Navigator */}
      <div className="date-nav animate-fade-in">
        <button className="date-nav-btn" onClick={() => setSelectedDate(d => addDaysStr(d, -1))}>
          <ChevronLeft size={22} />
        </button>
        <button className="date-nav-center" onClick={() => setSelectedDate(todayStr())}>
          <span className="date-nav-text">{formatDateDisplay(selectedDate)}</span>
          {!isToday && <span className="date-nav-hint">Tap for today</span>}
        </button>
        <button className="date-nav-btn" onClick={() => setSelectedDate(d => addDaysStr(d, 1))}>
          <ChevronRight size={22} />
        </button>
      </div>

      {error && <div className="auth-error" style={{margin: '1rem', color: 'var(--color-danger)'}}>{error}</div>}

      {/* Day Stats */}
      <div className="day-stats animate-fade-in-down delay-1">
        <div className="stat-card" style={{ borderLeftColor: 'var(--morning)' }}>
          <span className="stat-emoji">☀️</span>
          <span className="stat-value">{liveCounts.morning}</span>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--afternoon)' }}>
          <span className="stat-emoji">🌤️</span>
          <span className="stat-value">{liveCounts.afternoon}</span>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--night)' }}>
          <span className="stat-emoji">🌙</span>
          <span className="stat-value">{liveCounts.night}</span>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
          <span className="stat-label">Total</span>
          <span className="stat-value primary">₹{liveTotal}</span>
        </div>
      </div>


      {/* Members List */}
      <div className="members-list">
        {isLoading && rawEntries.length === 0 ? (
           <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">Loading dashboard...</div>
        ) : activeMembers.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 64 }}>👥</span>
            <h3>No Members Yet</h3>
            <p>Go to Group Settings to add members</p>
          </div>
        ) : (
          activeMembers.map((member, idx) => (
            <MemberRow
              key={member.user_id}
              memberId={member.user_id}
              name={member.name}
              meals={getMealState(member.user_id)}
              onToggle={handleToggle}
              disabled={member.user_id !== user.id}
              index={idx}
            />
          ))
        )}
      </div>
    </div>
  );
}
