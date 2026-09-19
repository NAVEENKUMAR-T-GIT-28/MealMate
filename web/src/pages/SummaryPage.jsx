import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonthNavigator from '../components/MonthNavigator';
import SummaryTable from '../components/SummaryTable';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useSummaryQuery } from '../hooks/useSummaryQuery';
import { usePricesQuery } from '../hooks/usePricesQuery';
import {
  currentMonthStr, formatMonth, getNextMonth, getPrevMonth,
} from '../utils/dateUtils';
import './SummaryPage.css';

export default function SummaryPage() {
  const { currentGroup, allMembers } = useGroup();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [month, setMonth] = useState(location.state?.month || currentMonthStr());

  const groupId = currentGroup?.id;

  // Server-state via TanStack Query
  const {
    data: summary = { members: [], grandTotal: 0 },
    isLoading,
    error: queryError,
  } = useSummaryQuery(groupId, month);

  const { data: pricesData } = usePricesQuery(groupId);

  // Compute latest active prices from the price history
  const currentPrices = (() => {
    const pricesMap = { morning: 0, afternoon: 0, night: 0 };
    if (!pricesData) return pricesMap;
    const now = new Date();
    for (const p of pricesData) {
      if (new Date(p.effective_from) <= now) {
        pricesMap[p.meal_type] = p.price;
      }
    }
    return pricesMap;
  })();

  const error = queryError ? 'Failed to load summary' : '';

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

      {isLoading && summary.members.length === 0 ? (
        <div className="flex justify-center p-8 text-[var(--color-text-secondary)]">Loading summary...</div>
      ) : summary.members.length > 0 ? (
        <div className="animate-fade-in-up delay-3">
          <SummaryTable
            members={[...summary.members].sort((a, b) => {
              if (a.user_id === user?.id) return -1;
              if (b.user_id === user?.id) return 1;

              const roleA = allMembers.find(m => m.user_id === a.user_id)?.role;
              const roleB = allMembers.find(m => m.user_id === b.user_id)?.role;

              if (roleA === 'admin') return -1;
              if (roleB === 'admin') return 1;

              return 0;
            })}
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
