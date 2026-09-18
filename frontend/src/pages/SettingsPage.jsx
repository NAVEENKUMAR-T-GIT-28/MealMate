import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor, CheckCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useGroup } from '../context/GroupContext';
import { pricesApi } from '../api/prices';
import { formatMonth, todayStr } from '../utils/dateUtils';
import './SettingsPage.css';

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const { currentGroup, isAdmin } = useGroup();

  const [morningInput, setMorningInput] = useState('');
  const [afternoonInput, setAfternoonInput] = useState('');
  const [nightInput, setNightInput] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Simplified month selection since dynamic months requires more API
  const [selectedMonth, setSelectedMonth] = useState(todayStr().substring(0, 7));

  const fetchPrices = useCallback(async () => {
    if (!currentGroup) return;
    try {
      const pricesData = await pricesApi.getPrices(currentGroup.id);
      if (pricesData) {
        // pricesData is sorted by effective_from DESC. We just take the first occurrence of each meal_type
        const latest = { morning: '', afternoon: '', night: '' };
        for (const p of pricesData) {
          if (latest[p.meal_type] === '') {
            latest[p.meal_type] = p.price;
          }
        }
        setMorningInput(String(latest.morning || 0));
        setAfternoonInput(String(latest.afternoon || 0));
        setNightInput(String(latest.night || 0));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch prices');
    }
  }, [currentGroup]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleSave = async () => {
    if (!currentGroup) return;
    setSaving(true);
    setError('');
    
    const today = todayStr();
    
    try {
      const promises = [];
      promises.push(pricesApi.setPrice(currentGroup.id, 'morning', Number(morningInput), today));
      promises.push(pricesApi.setPrice(currentGroup.id, 'afternoon', Number(afternoonInput), today));
      promises.push(pricesApi.setPrice(currentGroup.id, 'night', Number(nightInput), today));
      
      await Promise.all(promises);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to save prices');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (type) => {
    alert(`Export ${type.toUpperCase()} for ${formatMonth(selectedMonth)} — will work in future phase`);
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
                value={morningInput}
                onChange={(e) => setMorningInput(e.target.value)}
              />
            </div>
            <div className="price-row">
              <div className="price-label afternoon-label">🌤️ Afternoon</div>
              <input
                type="number"
                className="price-input"
                value={afternoonInput}
                onChange={(e) => setAfternoonInput(e.target.value)}
              />
            </div>
            <div className="price-row">
              <div className="price-label night-label">🌙 Night</div>
              <input
                type="number"
                className="price-input"
                value={nightInput}
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
          <div className="month-picker-btn" style={{cursor: 'default', backgroundColor: 'var(--bg-secondary)'}}>
            <span>{formatMonth(selectedMonth)}</span>
          </div>
        </div>

        <div className="export-row">
          <button className="export-btn excel" onClick={() => handleExport('excel')}>
            <FileSpreadsheet size={18} />
            Export Excel (.xlsx)
          </button>
          <button className="export-btn pdf" onClick={() => handleExport('pdf')}>
            <FileText size={18} />
            Export PDF (.pdf)
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
