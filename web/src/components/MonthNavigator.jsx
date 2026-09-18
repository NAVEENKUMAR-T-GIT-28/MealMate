import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MonthNavigator.css';

export default function MonthNavigator({ label, onPrev, onNext, onReset }) {
  return (
    <div className="month-nav animate-fade-in">
      <button className="month-nav-btn" onClick={onPrev} aria-label="Previous month">
        <ChevronLeft size={22} />
      </button>
      <button className="month-nav-label" onClick={onReset}>
        {label}
      </button>
      <button className="month-nav-btn" onClick={onNext} aria-label="Next month">
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
