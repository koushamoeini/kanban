import React, { useState } from 'react';
import { Task, Priority } from '../types';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDragStart?: (taskId: string) => void;
  onDragEnd?: () => void;
  isBeingDragged?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
  isBeingDragged
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPastDue = task.dueDate && new Date(task.dueDate) < new Date();

  const getPriorityIcon = (priority: Priority): string => {
    switch (priority) {
      case Priority.HIGH: return '▲';
      case Priority.MEDIUM: return '●';
      case Priority.LOW: return '▼';
      default: return '●';
    }
  };

  const getPriorityClass = (priority: Priority): string => {
    switch (priority) {
      case Priority.HIGH: return 'high';
      case Priority.MEDIUM: return 'medium';
      case Priority.LOW: return 'low';
      default: return '';
    }
  };

  return (
    <div
      className={`task-card ${isBeingDragged ? 'is-dragging' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(task.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
    >
      {showDeleteConfirm && (
        <div className="delete-confirmation" onClick={(e) => e.stopPropagation()}>
          <p>حذف شود؟</p>
          <div className="confirmation-buttons">
            <button className="btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>بله</button>
            <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>خیر</button>
          </div>
        </div>
      )}

      <div className="task-card-content">
        <div className="task-header">
          <div className="task-labels-top">
            {task.labels.map(l => (
              <span key={l.id} className="label-pill">{l.name}</span>
            ))}
          </div>
          <button
            className="btn-remove-task"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            ✕
          </button>
        </div>

        <h3 className="task-title">{task.title}</h3>
        
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-meta">
          <div className="task-meta-left">
            <span className={`priority-icon ${getPriorityClass(task.priority)}`}>
              {getPriorityIcon(task.priority)}
            </span>
            {task.dueDate && (
              <span className="task-date">
                {new Date(task.dueDate).toLocaleDateString('fa-IR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
          {isPastDue && (
            <div className="badge-past-due">گذشته</div>
          )}
        </div>
      </div>
    </div>
  );
};
