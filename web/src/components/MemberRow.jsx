import MealToggle from './MealToggle';
import { avatarColor } from '../utils/dateUtils';
import './MemberRow.css';

export default function MemberRow({ memberId, name, meals, onToggle, disabled = false, index = 0 }) {
  const bgColor = avatarColor(name);

  return (
    <div
      className="member-row animate-fade-in-right"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="member-row-info">
        <div className="member-avatar" style={{ background: bgColor }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="member-name">{name}</span>
      </div>
      <div className="member-row-toggles">
        <MealToggle
          mealType="morning"
          isActive={meals.morning}
          onToggle={() => onToggle(memberId, 'morning')}
          disabled={disabled}
        />
        <MealToggle
          mealType="afternoon"
          isActive={meals.afternoon}
          onToggle={() => onToggle(memberId, 'afternoon')}
          disabled={disabled}
        />
        <MealToggle
          mealType="night"
          isActive={meals.night}
          onToggle={() => onToggle(memberId, 'night')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
