import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { summaryApi } from '../api/summary';
import { formatMonth, formatShortMonth, todayStr, addDaysStr } from '../utils/dateUtils';
import './HistoryPage.css';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { currentGroup } = useGroup();
  const [loading, setLoading] = useState(true);
  const [monthsData, setMonthsData] = useState([]);

  const fetchHistory = useCallback(async () => {
    if (!currentGroup) return;
    try {
      setLoading(true);
      // Fetch months from group creation up to current month (max 24 months to avoid huge requests)
      const current = new Date();
      const createdDate = currentGroup.created_at ? new Date(currentGroup.created_at) : current;
      
      const monthsToFetch = [];
      let d = new Date(current.getFullYear(), current.getMonth(), 1);
      const end = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1);

      let maxMonths = 24; 
      while (d >= end && maxMonths > 0) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthsToFetch.push(`${y}-${m}`);
        d.setMonth(d.getMonth() - 1);
        maxMonths--;
      }

      const results = await Promise.all(
        monthsToFetch.map(async m => {
          try {
            const data = await summaryApi.getSummary(currentGroup.id, m);
            const totalEntryCount = data.members.reduce((sum, member) => {
              return sum + (member.morning_count || 0) + (member.afternoon_count || 0) + (member.night_count || 0);
            }, 0);
            return { month: m, totalSpent: data.grandTotal, entryCount: totalEntryCount };
          } catch {
            return null;
          }
        })
      );
      setMonthsData(results.filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentGroup]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Group by year
  const years = (() => {
    const map = new Map();
    for (const m of monthsData) {
      const year = m.month.substring(0, 4);
      if (!map.has(year)) map.set(year, []);
      map.get(year).push(m);
    }
    const list = [];
    for (const [year, months] of map) {
      list.push({
        year,
        totalSpent: months.reduce((s, m) => s + m.totalSpent, 0),
        monthCount: months.length,
        months,
      });
    }
    list.sort((a, b) => b.year.localeCompare(a.year));
    return list;
  })();

  const [expandedYears, setExpandedYears] = useState(null);

  useEffect(() => {
    if (expandedYears === null && years.length > 0) {
      setExpandedYears(new Set([years[0].year]));
    }
  }, [years, expandedYears]);

  const maxSpend = (() => {
    let max = 0;
    for (const y of years) for (const m of y.months) if (m.totalSpent > max) max = m.totalSpent;
    return max || 1;
  })();

  const toggleYear = (year) => {
    setExpandedYears(prev => {
      const next = new Set(prev || []);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">Loading history...</div>;
  }

  if (years.length === 0) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: 64 }}>📅</span>
        <h3>No History</h3>
        <p>Start marking meals on the Today tab to build history</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      {years.map((yearData, yi) => {
        const expanded = expandedYears ? expandedYears.has(yearData.year) : false;
        return (
          <div key={yearData.year} className="animate-fade-in-down" style={{ animationDelay: `${yi * 100}ms` }}>
            {/* Year Card */}
            <button
              className={`year-card ${expanded ? 'expanded' : ''}`}
              onClick={() => toggleYear(yearData.year)}
            >
              <div className="year-left">
                <div className="year-icon-wrap">
                  <Calendar size={22} />
                </div>
                <div>
                  <div className="year-title">{yearData.year}</div>
                  <div className="year-meta">
                    {yearData.monthCount} month{yearData.monthCount !== 1 ? 's' : ''} recorded
                  </div>
                </div>
              </div>
              <div className="year-right">
                <span className="year-total">₹{yearData.totalSpent.toLocaleString()}</span>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
              <div className="expanded-content">
                {/* Spending Bars */}
                <div className="spending-section">
                  <div className="spending-label">Month-wise Spending</div>
                  {yearData.months.map(m => {
                    const ratio = m.totalSpent / maxSpend;
                    return (
                      <div key={m.month} className="bar-row">
                        <span className="bar-label">{formatShortMonth(m.month)}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                          />
                        </div>
                        <span className="bar-value">₹{m.totalSpent.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Month Cards */}
                {yearData.months.map(m => (
                  <button
                    key={m.month}
                    className="month-card"
                    onClick={() => navigate(`/summary`, { state: { month: m.month } })}
                  >
                    <div className="month-left">
                      <div className="month-dot" />
                      <div>
                        <div className="month-name">{formatMonth(m.month)}</div>
                        <div className="month-entries">{m.entryCount} meal entries</div>
                      </div>
                    </div>
                    <div className="month-right">
                      <span className="month-total">₹{m.totalSpent.toLocaleString()}</span>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
