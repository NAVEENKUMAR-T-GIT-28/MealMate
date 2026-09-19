import { useState } from 'react';
import { Sun, Moon, Monitor, CheckCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useGroup } from '../context/GroupContext';
import { usePricesQuery } from '../hooks/usePricesQuery';
import { useSavePrices } from '../hooks/useSavePrices';
import { formatMonth, todayStr } from '../utils/dateUtils';
import { exportToPdf } from '../utils/exportPdf';
import { exportToExcel } from '../utils/exportExcel';
import './SettingsPage.css';

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const { currentGroup, isAdmin } = useGroup();

  const groupId = currentGroup?.id;

  // Server-state via TanStack Query
  const { data: pricesData } = usePricesQuery(groupId);

  // Derive latest prices from cached price history
  const latestPrices = (() => {
    const latest = { morning: '0', afternoon: '0', night: '0' };
    if (!pricesData) return latest;
    for (const p of pricesData) {
      if (latest[p.meal_type] === '0' || latest[p.meal_type] === '') {
        latest[p.meal_type] = String(p.price);
      }
    }
    return latest;
  })();

  const [morningInput, setMorningInput] = useState(null);
  const [afternoonInput, setAfternoonInput] = useState(null);
  const [nightInput, setNightInput] = useState(null);

  // Use local input if user has edited, otherwise show cached server data
  const morningValue = morningInput !== null ? morningInput : latestPrices.morning;
  const afternoonValue = afternoonInput !== null ? afternoonInput : latestPrices.afternoon;
  const nightValue = nightInput !== null ? nightInput : latestPrices.night;

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(todayStr().substring(0, 7));

  // Price mutation via TanStack Query
  const savePricesMutation = useSavePrices(groupId);

  const handleSave = async () => {
    if (!currentGroup) return;
    setError('');
    const today = todayStr();

    savePricesMutation.mutate(
      {
        morningPrice: Number(morningValue),
        afternoonPrice: Number(afternoonValue),
        nightPrice: Number(nightValue),
        effectiveFrom: today,
      },
      {
        onSuccess: () => {
          // Reset local overrides so inputs reflect fresh server data
          setMorningInput(null);
          setAfternoonInput(null);
          setNightInput(null);
        },
        onError: (err) => {
          console.error(err);
          setError('Failed to save prices');
        },
      }
    );
  };

  const saved = savePricesMutation.isSuccess;
  const saving = savePricesMutation.isPending;

  const handleExport = async (type) => {
    if (!currentGroup) return;
    setExporting(true);
    setError('');
    try {
      if (type === 'pdf') {
        await exportToPdf(currentGroup.id, selectedMonth);
      } else if (type === 'excel') {
        await exportToExcel(currentGroup.id, selectedMonth);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate export. Make sure there is data for this month.');
    } finally {
      setExporting(false);
    }
  };

  const themeOptions = [
    { key: 'light', icon: Sun, label: 'Light' },
    { key: 'dark', icon: Moon, label: 'Dark' },
    { key: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="settings-page">
      {/* Appearance */}
      <div className="animate-fade-in">
        <h2 className="section-title">Appearance</h2>
        <p className="section-subtitle">Choose your UI theme preference.</p>
      </div>

      <div className="theme-selector animate-fade-in-down delay-1">
        {themeOptions.map(opt => (
          <button
            key={opt.key}
            className={`theme-option ${mode === opt.key ? 'active' : ''}`}
            onClick={() => setMode(opt.key)}
          >
            <opt.icon size={18} />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {error && <div className="auth-error" style={{marginTop: '1rem', color: 'var(--color-danger)'}}>{error}</div>}

      {/* Meal Prices (Admin only) */}
      {isAdmin && (
        <>
          <div className="animate-fade-in-down delay-2">
            <h2 className="section-title" style={{ marginTop: 'var(--sp-xl)' }}>Meal Prices</h2>
            <p className="section-subtitle">
              Changes take effect from today onwards. Past calculations stay unchanged.
            </p>
          </div>

          <div className="price-card animate-fade-in-down delay-3">
            <div className="price-row">
              <div className="price-label morning-label">☀️ Morning</div>
              <input
                type="number"
                className="price-input"
                value={morningValue}
                onChange={(e) => setMorningInput(e.target.value)}
              />
            </div>
            <div className="price-row">
              <div className="price-label afternoon-label">🌤️ Afternoon</div>
              <input
                type="number"
                className="price-input"
                value={afternoonValue}
                onChange={(e) => setAfternoonInput(e.target.value)}
              />
            </div>
            <div className="price-row">
              <div className="price-label night-label">🌙 Night</div>
              <input
                type="number"
                className="price-input"
                value={nightValue}
                onChange={(e) => setNightInput(e.target.value)}
              />
            </div>
            <button
              className="btn-primary save-price-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <CheckCircle size={18} />
              {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Prices'}
            </button>
          </div>
        </>
      )}

      {/* Reports */}
      <div className="animate-fade-in-down delay-4">
        <h2 className="section-title" style={{ marginTop: 'var(--sp-xxl)' }}>Reports</h2>
      </div>

      <div className="reports-card animate-fade-in-down delay-5">
        <label className="reports-label">Select Month</label>
        <div className="month-picker-wrapper">
          <input
            type="month"
            className="month-picker-btn"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ cursor: 'pointer', fontFamily: 'inherit' }}
          />
        </div>

        <div className="export-row">
          <button 
            className="export-btn excel" 
            onClick={() => handleExport('excel')}
            disabled={exporting}
          >
            <FileSpreadsheet size={18} />
            {exporting ? 'Generating...' : 'Export Excel (.xlsx)'}
          </button>
          <button 
            className="export-btn pdf" 
            onClick={() => handleExport('pdf')}
            disabled={exporting}
          >
            <FileText size={18} />
            {exporting ? 'Generating...' : 'Export PDF (.pdf)'}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="app-info animate-fade-in-down delay-6">
        <div className="app-info-name">MealMate</div>
        <div className="app-info-version">v2.0.0 — Cloud Multi-User</div>
        <div className="app-info-desc">
          Track daily meals, manage dynamic pricing, and generate reports for your PG/Mess group.
        </div>
      </div>
    </div>
  );
}
