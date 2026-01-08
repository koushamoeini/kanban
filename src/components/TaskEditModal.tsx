import React, { useState, useEffect, useRef } from 'react';
import { Task, Label, Priority } from '../types';
import './EditModal.css';

interface TaskEditModalProps {
  task: Task;
  allLabels: Label[];
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, allLabels, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [labels, setLabels] = useState<Label[]>(task.labels);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [description]);

  const handleToggleLabel = (label: Label) => {
    setLabels(prev => 
      prev.some(l => l.id === label.id)
        ? prev.filter(l => l.id !== label.id)
        : [...prev, label]
    );
  };

  const handleSave = () => {
    if (title.trim()) {
      onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        labels,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined
      });
    }
  };

  return (
    <div className="edit-form">
      <div className="form-group">
        <label>عنوان</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="عنوان وظیفه"
        />
      </div>
      <div className="form-group">
        <label>توضیحات</label>
        <textarea 
          ref={descriptionRef}
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="توضیحات اختیاری"
        />
      </div>
      <div className="form-group">
        <label>برچسب‌ها</label>
        <div className="labels-grid">
          {allLabels.map(label => (
            <button
              key={label.id}
              className={`label-item ${labels.some(l => l.id === label.id) ? 'active' : ''}`}
              onClick={() => handleToggleLabel(label)}
            >
              {label.name}
            </button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>اولویت</label>
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
            <option value={Priority.LOW}>کم</option>
            <option value={Priority.MEDIUM}>متوسط</option>
            <option value={Priority.HIGH}>زیاد</option>
          </select>
        </div>
        <div className="form-group">
          <label>تاریخ سررسید</label>
          <input 
            type="date" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn-save" onClick={handleSave}>ذخیره</button>
      </div>
    </div>
  );
};
