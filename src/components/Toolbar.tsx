import React, { useState } from 'react';
import { Label } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allLabels: Label[];
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  filterPriority: number | 'all';
  onPriorityFilterChange: (p: number | 'all') => void;
  sortBy: 'priority' | 'dueDate' | 'none';
  onSortChange: (sort: 'priority' | 'dueDate' | 'none') => void;
  onAddColumn: () => void;
  onAddLabel: (name: string, color?: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  allLabels,
  selectedLabels,
  onLabelsChange,
  filterPriority,
  onPriorityFilterChange,
  sortBy,
  onSortChange,
  onAddColumn,
  onAddLabel,
  theme,
  toggleTheme
}) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);

  const handleLabelToggle = (labelId: string): void => {
    const next = selectedLabels.includes(labelId)
      ? selectedLabels.filter(id => id !== labelId)
      : [...selectedLabels, labelId];
    onLabelsChange(next);
  };

  const handleAddLabel = (): void => {
    if (newLabelName.trim()) {
      onAddLabel(newLabelName.trim());
      setNewLabelName('');
      setShowLabelInput(false);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-right-section">
        <button className="btn-theme-toggle" onClick={toggleTheme} title="تغییر ظاهر">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        
        <div className="filter-priority-group">
          <select
            className="sort-select"
            value={filterPriority}
            onChange={(e) => onPriorityFilterChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">همه اولویت‌ها</option>
            <option value={1}>کم (Low)</option>
            <option value={2}>متوسط (Med)</option>
            <option value={3}>زیاد (High)</option>
          </select>
        </div>

        <div className="sort-group">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'priority' | 'dueDate' | 'none')}
          >
            <option value="none">مرتب‌سازی براساس...</option>
            <option value="priority">اولویت</option>
            <option value="dueDate">تاریخ</option>
          </select>
        </div>
      </div>

      <div className="toolbar-center-section">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="جستجوی وظایف..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="toolbar-left-section">
        <div className="column-management">
          <button
            type="button"
            className="btn-add-column"
            onClick={onAddColumn}
          >
            + ستون جدید
          </button>
        </div>
      </div>

      <div className="toolbar-labels-row">
        <div className="filter-group">
          <span className="filter-label">فیلتر برچسب:</span>
          <div className="labels-list">
            {allLabels.map(label => (
              <label 
                key={label.id} 
                className={`label-checkbox ${selectedLabels.includes(label.id) ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedLabels.includes(label.id)}
                  onChange={() => handleLabelToggle(label.id)}
                  hidden
                />
                <span>{label.name}</span>
              </label>
            ))}
          </div>
          
          {showLabelInput ? (
            <div className="new-label-input-wrapper">
              <input 
                type="text" 
                value={newLabelName} 
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="برچسب جدید..."
                className="new-label-input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                style={{ width: `${Math.max(80, newLabelName.length * 8 + 20)}px` }}
              />
              <button className="btn-save-label" onClick={handleAddLabel}>✓</button>
              <button className="btn-cancel-label" onClick={() => setShowLabelInput(false)}>✕</button>
            </div>
          ) : (
            <button className="btn-add-label-trigger" onClick={() => setShowLabelInput(true)}>
              + برچسب
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
