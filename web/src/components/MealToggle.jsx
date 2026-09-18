import { useState } from 'react';
import './MealToggle.css';

const MEAL_CONFIG = {
  morning:   { label: 'Morn', emoji: '☀️', colorVar: '--morning', bgVar: '--morning-bg' },
  afternoon: { label: 'Aft',  emoji: '🌤️', colorVar: '--afternoon', bgVar: '--afternoon-bg' },
  night:     { label: 'Night', emoji: '🌙', colorVar: '--night', bgVar: '--night-bg' },
};

export default function MealToggle({ mealType, isActive, onToggle, disabled = false }) {
  const [pressed, setPressed] = useState(false);
  const config = MEAL_CONFIG[mealType];

  const style = {
    '--meal-color': `var(${config.colorVar})`,
    '--meal-bg': `var(${config.bgVar})`,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'default' : 'pointer'
  };

  return (
    <button
      className={`meal-toggle ${isActive ? 'active' : ''} ${pressed ? 'pressed' : ''}`}
      style={style}
      onClick={disabled ? undefined : onToggle}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => !disabled && setPressed(false)}
      onMouseLeave={() => !disabled && setPressed(false)}
      disabled={disabled}
      aria-label={`${config.label} meal toggle`}
    >
      <span className="meal-toggle-emoji">{config.emoji}</span>
      <span className="meal-toggle-label">{config.label}</span>
    </button>
  );
}
