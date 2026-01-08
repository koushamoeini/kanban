import React, { useState, useEffect } from 'react';
import { Label, TaskStatus } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allLabels: Label[];
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  sortBy: 'priority' | 'dueDate' | 'none';
  onSortChange: (sort: 'priority' | 'dueDate' | 'none') => void;
  availableColumns: TaskStatus[];
  onAddColumn: (status: TaskStatus) => void;
  onAddLabel: (name: string, color?: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const columnLabel = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO:
      return 'در دست اقدام';
    case TaskStatus.IN_PROGRESS:
      return 'در دست انجام';
    case TaskStatus.DONE:
      return 'انجام شده';
    default:
      return status;
  }
};

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  allLabels,
  selectedLabels,
  onLabelsChange,
  sortBy,
  onSortChange,
  availableColumns,
  onAddColumn,
  onAddLabel,
  theme,
  toggleTheme
}) => {
  const [columnChoice, setColumnChoice] = useState<TaskStatus | ''>('');
  const [newLabelName, setNewLabelName] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);

  useEffect(() => {
    if (availableColumns.length === 0) {
      setColumnChoice('');
      return;
    }

    if (!availableColumns.includes(columnChoice as TaskStatus)) {
      setColumnChoice(availableColumns[0]);
    }
  }, [availableColumns, columnChoice]);

  const handleLabelToggle = (labelId: string): void => {
    const next = selectedLabels.includes(labelId)
      ? selectedLabels.filter(id => id !== labelId)
      : [...selectedLabels, labelId];
    onLabelsChange(next);
  };

  const handleAddColumn = (): void => {
    if (!columnChoice) return;
    onAddColumn(columnChoice);
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
          <select
            value={columnChoice}
            onChange={(e) => setColumnChoice(e.target.value as TaskStatus)}
            className="sort-select"
            disabled={availableColumns.length === 0}
          >
            {availableColumns.length === 0 ? (
              <option value="">همه ستون‌ها فعال هستند</option>
            ) : (
              availableColumns.map(status => (
                <option key={status} value={status}>
                  {columnLabel(status)}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            className="btn-add-column"
            onClick={handleAddColumn}
            disabled={!columnChoice}
          >
            + ستون
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
