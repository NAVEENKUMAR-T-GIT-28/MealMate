import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonthNavigator from '../components/MonthNavigator';
import SummaryTable from '../components/SummaryTable';
import { useGroup } from '../context/GroupContext';
import { summaryApi } from '../api/summary';
import { pricesApi } from '../api/prices';
import {
  currentMonthStr, formatMonth, getNextMonth, getPrevMonth,
} from '../utils/dateUtils';
import './SummaryPage.css';

export default function SummaryPage() {
  const { currentGroup } = useGroup();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [month, setMonth] = useState(location.state?.month || currentMonthStr());
  const [summary, setSummary] = useState({ members: [], grandTotal: 0 });
  const [currentPrices, setCurrentPrices] = useState({ morning: 0, afternoon: 0, night: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummaryAndPrices = useCallback(async () => {
    if (!currentGroup) return;
    try {
      setLoading(true);
      setError('');
      const [summaryData, pricesData] = await Promise.all([
        summaryApi.getSummary(currentGroup.id, month),
        pricesApi.getPrices(currentGroup.id)
      ]);
      
      setSummary(summaryData);
      
      // Compute latest active prices
      if (pricesData) {
        const pricesMap = { morning: 0, afternoon: 0, night: 0 };
        const now = new Date();
        for (const p of pricesData) {
          if (new Date(p.effective_from) <= now) {
            pricesMap[p.meal_type] = p.price;
          }
        }
        setCurrentPrices(pricesMap);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [currentGroup, month]);

  useEffect(() => {
    fetchSummaryAndPrices();
  }, [fetchSummaryAndPrices]);

  if (!currentGroup) return <div className="summary-page"><div className="empty-state">No group selected.</div></div>;

  return (
    <div className="summary-page">
      <MonthNavigator
        label={formatMonth(month)}
        onPrev={() => setMonth(m => getPrevMonth(m))}
        onNext={() => setMonth(m => getNextMonth(m))}
        onReset={() => setMonth(currentMonthStr())}
      />

      {error && <div className="auth-error" style={{margin: '1rem', color: 'var(--color-danger)'}}>{error}</div>}

      {/* Price Info */}
      <div className="price-chips animate-fade-in-down delay-1">
        <span className="price-chip morning">☀️ ₹{currentPrices.morning}</span>
        <span className="price-chip afternoon">🌤️ ₹{currentPrices.afternoon}</span>
        <span className="price-chip night">🌙 ₹{currentPrices.night}</span>
      </div>

      {/* Grand Total Card */}
      <div className="grand-total-card animate-fade-in-down delay-2">
        <span className="grand-total-label">Month Total</span>
        <span className="grand-total-value">₹{summary.grandTotal.toLocaleString()}</span>
        <span className="grand-total-sub">
          {summary.members.length} member{summary.members.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary Table */}
      {loading ? (
        <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">Loading summary...</div>
      ) : summary.members.length > 0 ? (
        <div className="animate-fade-in-up delay-3">
          <SummaryTable
            members={summary.members}
            grandTotal={summary.grandTotal}
            onMemberPress={(memberId) =>
              navigate(`/summary/${memberId}`, { state: { month } })
            }
          />
        </div>
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 64 }}>📊</span>
          <h3>No Data</h3>
          <p>No meal entries recorded for {formatMonth(month)}</p>
        </div>
      )}
    </div>
  );
}
