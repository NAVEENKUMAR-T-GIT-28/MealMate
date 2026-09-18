import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import './GroupSwitcher.css';

export default function GroupSwitcher() {
  const { currentGroup, groups, switchGroup } = useGroup();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (groups.length <= 1) {
    return (
      <div className="group-switcher-single">
        <span className="group-name">{currentGroup?.name}</span>
      </div>
    );
  }

  return (
    <div className="group-switcher" ref={ref}>
      <button className="group-switcher-btn" onClick={() => setOpen(!open)}>
        <span className="group-name">{currentGroup?.name}</span>
        <ChevronDown size={16} className={`chevron ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="group-dropdown">
          {groups.map(g => (
            <button
              key={g.id}
              className={`group-option ${g.id === currentGroup?.id ? 'active' : ''}`}
              onClick={() => { switchGroup(g.id); setOpen(false); }}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
