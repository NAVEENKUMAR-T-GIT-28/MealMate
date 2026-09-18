import { useState, useMemo, useEffect, useCallback } from 'react';
import MealToggle from '../components/MealToggle';
import MonthNavigator from '../components/MonthNavigator';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/attendance';
import {
  currentMonthStr, formatMonth, getNextMonth, getPrevMonth,
  getDaysInMonth
} from '../utils/dateUtils';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import './AttendancePage.css';

export default function AttendancePage() {
  const { currentGroup, activeMembers } = useGroup();
  const { user } = useAuth();
  
  const [month, setMonth] = useState(currentMonthStr());
  // Default to the current logged in user if they are in the active members, else first member
  const initialMemberId = activeMembers.find(m => m.user_id === user?.id)?.id || activeMembers[0]?.id || null;
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  
  const [rawEntries, setRawEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const days = useMemo(() => getDaysInMonth(month), [month]);
  const selectedMember = activeMembers.find(m => m.id === selectedMemberId);

  const fetchAttendance = useCallback(async () => {
    if (!currentGroup) return;
    try {
      setLoading(true);
      setError('');
      const data = await attendanceApi.getAttendanceForMonth(currentGroup.id, month);
      setRawEntries(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [currentGroup, month]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Handle member changing active status later, default back
  useEffect(() => {
    if (!selectedMemberId && activeMembers.length > 0) {
      const myId = activeMembers.find(m => m.user_id === user?.id)?.id;
      setSelectedMemberId(myId || activeMembers[0].id);
    }
  }, [activeMembers, selectedMemberId, user]);

  const getMealState = useCallback((dateStr) => {
    const entry = rawEntries.find(e => e.user_id === selectedMember?.user_id && e.date === dateStr);
    return {
      morning: entry?.morning || false,
      afternoon: entry?.afternoon || false,
      night: entry?.night || false,
    };
  }, [rawEntries, selectedMember]);

  const handleToggle = async (dateStr, meal) => {
    if (!currentGroup || !selectedMember) return;
    
    // Check permission - can only toggle for self
    if (selectedMember.user_id !== user.id) {
      alert("You can only update your own attendance.");
      return;
    }

    // Optimistic update
    const previousEntries = [...rawEntries];
    setRawEntries(prev => {
      const newEntries = [...prev];
      const index = newEntries.findIndex(e => e.user_id === selectedMember.user_id && e.date === dateStr);
      if (index >= 0) {
        newEntries[index] = { ...newEntries[index], [meal]: !newEntries[index][meal] };
      } else {
        newEntries.push({
          user_id: selectedMember.user_id,
          member_name: selectedMember.name,
          morning: meal === 'morning',
          afternoon: meal === 'afternoon',
          night: meal === 'night',
          date: dateStr
        });
      }
      return newEntries;
    });

    try {
      await attendanceApi.toggleMeal(currentGroup.id, dateStr, meal);
    } catch (err) {
      console.error(err);
      setRawEntries(previousEntries);
      alert(err.response?.data?.error || 'Failed to update attendance');
    }
  };

  if (!currentGroup) return <div className="attendance-page"><div className="empty-state">No group selected.</div></div>;

  return (
    <div className="attendance-page">
      <MonthNavigator
        label={formatMonth(month)}
        onPrev={() => setMonth(m => getPrevMonth(m))}
        onNext={() => setMonth(m => getNextMonth(m))}
        onReset={() => setMonth(currentMonthStr())}
      />

      {error && <div className="auth-error" style={{margin: '1rem', color: 'var(--color-danger)'}}>{error}</div>}

      {/* Member Selector */}
      <div className="member-selector animate-fade-in-down delay-1">
        {activeMembers.map(m => (
          <button
            key={m.id}
            className={`member-chip ${m.id === selectedMemberId ? 'active' : ''}`}
            onClick={() => setSelectedMemberId(m.id)}
          >
            {m.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar animate-fade-in-up delay-2">
        <div className="calendar-header">
          <span>Date</span>
          <span>☀️ Morning</span>
          <span>🌤️ Afternoon</span>
          <span>🌙 Night</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">Loading calendar...</div>
        ) : (
          <div className="calendar-body">
            {days.map(dateStr => {
              const d = parseISO(dateStr);
              const future = isFuture(d);
              const today = isToday(d);
              const meals = getMealState(dateStr);
              const dayNum = format(d, 'd');
              const dayName = format(d, 'EEE');

              return (
                <div
                  key={dateStr}
                  className={`calendar-row ${today ? 'today' : ''} ${future ? 'future' : ''}`}
                >
                  <div className="calendar-date">
                    <span className="calendar-day-num">{dayNum}</span>
                    <span className="calendar-day-name">{dayName}</span>
                  </div>
                  <div className="calendar-meals">
                    <MealToggle
                      mealType="morning"
                      isActive={meals.morning}
                      onToggle={() => !future && handleToggle(dateStr, 'morning')}
                      disabled={selectedMember?.user_id !== user.id}
                    />
                    <MealToggle
                      mealType="afternoon"
                      isActive={meals.afternoon}
                      onToggle={() => !future && handleToggle(dateStr, 'afternoon')}
                      disabled={selectedMember?.user_id !== user.id}
                    />
                    <MealToggle
                      mealType="night"
                      isActive={meals.night}
                      onToggle={() => !future && handleToggle(dateStr, 'night')}
                      disabled={selectedMember?.user_id !== user.id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
