import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCheck } from 'lucide-react';
import MemberRow from '../components/MemberRow';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/attendance';
import { pricesApi } from '../api/prices';
import { todayStr, addDaysStr, formatDateDisplay } from '../utils/dateUtils';
import './DashboardPage.css';

export default function DashboardPage() {
  const { currentGroup, activeMembers, isAdmin } = useGroup();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const [rawEntries, setRawEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveTotal, setLiveTotal] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    if (!currentGroup) return;
    try {
      setLoading(true);
      setError('');
      // Fetch attendance for the specific date
      const attendanceData = await attendanceApi.getAttendanceForDate(currentGroup.id, selectedDate);
      setRawEntries(attendanceData);
      
      // Calculate live total for the date based on prices
      const pricesData = await pricesApi.getPrices(currentGroup.id);
      
      if (pricesData) {
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
        const myEntry = attendanceData.find(e => e.user_id === user.id);
        if (myEntry) {
          if (myEntry.morning) total += (currentPrices.morning || 0);
          if (myEntry.afternoon) total += (currentPrices.afternoon || 0);
          if (myEntry.night) total += (currentPrices.night || 0);
        }
        setLiveTotal(total);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [currentGroup, selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
    // Optimistic update
    const previousEntries = [...rawEntries];
    
    setRawEntries(prev => {
      const newEntries = [...prev];
      const index = newEntries.findIndex(e => e.user_id === memberId);
      if (index >= 0) {
        newEntries[index] = { ...newEntries[index], [meal]: !newEntries[index][meal] };
      } else {
        const member = activeMembers.find(m => m.user_id === memberId);
        newEntries.push({
          user_id: memberId,
          member_name: member?.name,
          morning: meal === 'morning',
          afternoon: meal === 'afternoon',
          night: meal === 'night',
          date: selectedDate
        });
      }
      return newEntries;
    });

    try {
      await attendanceApi.toggleMeal(currentGroup.id, selectedDate, meal, memberId);
      // We could re-fetch dashboard data here to ensure accuracy of liveTotal
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setRawEntries(previousEntries);
      alert(err.response?.data?.error || 'Failed to update attendance');
    }
  }, [currentGroup, selectedDate, rawEntries, activeMembers, fetchDashboardData]);


  // Compute live counts
  const liveCounts = { morning: 0, afternoon: 0, night: 0 };
  for (const entry of rawEntries) {
    if (entry.morning) liveCounts.morning++;
    if (entry.afternoon) liveCounts.afternoon++;
    if (entry.night) liveCounts.night++;
  }

  const isToday = selectedDate === todayStr();

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
        {loading && rawEntries.length === 0 ? (
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
