import { useState } from 'react';

export default function Header({ groups, selectedGroup, onGroupChange, title, onBack }) {
  return (
    <header className="header">
      {onBack && (
        <button className="back-btn" onClick={onBack}>←</button>
      )}
      <h1>{title || 'Nihongo Study'}</h1>
      {groups && groups.length > 0 && (
        <select
          value={selectedGroup || ''}
          onChange={e => onGroupChange(e.target.value)}
        >
          {groups.map(g => (
            <option key={g.name} value={g.name}>
              {g.name.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      )}
    </header>
  );
}
