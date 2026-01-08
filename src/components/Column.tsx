import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, Label, Priority } from '../types';
import { TaskCard } from './TaskCard';
import './Column.css';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  allLabels: Label[];
  onAddTask: (
    title: string, 
    status: TaskStatus, 
    description?: string, 
    labels?: Label[],
    priority?: Priority,
    dueDate?: Date
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onEditColumn: (status: TaskStatus, title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onTaskDrop: (sourceId: string, targetStatus: TaskStatus, targetTaskId?: string) => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskDragEnd: () => void;
  draggingTaskId: string | null;
  onRemoveColumn?: (status: TaskStatus) => void;
  isColumnRemovable?: boolean;
}

export const Column: React.FC<ColumnProps> = ({
  status,
  title,
  tasks,
  allLabels,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onEditColumn,
  onUpdateTask,
  onTaskDrop,
  onTaskDragStart,
  onTaskDragEnd,
  draggingTaskId,
  onRemoveColumn,
  isColumnRemovable
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskLabels, setNewTaskLabels] = useState<Label[]>([]);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [isColumnDropActive, setIsColumnDropActive] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAddingTask && descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [newTaskDescription, isAddingTask]);

  const handleAddClick = (): void => {
    setIsAddingTask(true);
  };

  const handleAddTask = (): void => {
    if (newTaskTitle.trim()) {
      const dueDate = newTaskDueDate ? new Date(newTaskDueDate) : undefined;
      onAddTask(
        newTaskTitle.trim(), 
        status, 
        newTaskDescription.trim(), 
        newTaskLabels,
        newTaskPriority,
        dueDate
      );
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskLabels([]);
      setNewTaskPriority(Priority.MEDIUM);
      setNewTaskDueDate('');
      setIsAddingTask(false);
    }
  };

  const handleToggleNewLabel = (label: Label): void => {
    setNewTaskLabels(prev => 
      prev.some(l => l.id === label.id)
        ? prev.filter(l => l.id !== label.id)
        : [...prev, label]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
    }
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsColumnDropActive(true);
  };

  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('column-content')) {
      setIsColumnDropActive(false);
    }
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsColumnDropActive(false);
    setDragOverTaskId(null);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId) {
      onTaskDrop(sourceId, status);
    }
  };

  const handleCardDragOver = (e: React.DragEvent<HTMLDivElement>, taskId: string): void => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleCardDragLeave = (e: React.DragEvent<HTMLDivElement>, taskId: string): void => {
    // Only clear if we are leaving to an element outside this specific drop target
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverTaskId(prev => (prev === taskId ? null : prev));
    }
  };

  const handleCardDrop = (e: React.DragEvent<HTMLDivElement>, taskId: string): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTaskId(null);
    setIsColumnDropActive(false);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== taskId) {
      onTaskDrop(sourceId, status, taskId);
    }
  };

  return (
    <div className="column">
      {showDeleteConfirm && (
        <div className="column-delete-confirmation">
          <div className="confirm-content">
            <p>آیا از حذف این ستون اطمینان دارید؟.</p>
            <div className="confirm-actions">
              <button 
                className="btn-confirm-delete" 
                onClick={() => {
                  onRemoveColumn?.(status);
                  setShowDeleteConfirm(false);
                }}
              >
                بله، حذف کن
              </button>
              <button 
                className="btn-cancel-delete" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="column-header">
        <div className="title-section">
          <h2 onDoubleClick={() => onEditColumn(status, title)}>
            {title} <span className="task-count">({tasks.length})</span>
          </h2>
          <button 
            className="btn-edit-title" 
            onClick={() => onEditColumn(status, title)}
            title="ویرایش عنوان"
          >
            ✎
          </button>
        </div>
        <div className="column-header-actions">
          {isColumnRemovable && onRemoveColumn && (
            <button
              className="btn-remove-column"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label={`حذف ستون ${title}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        className={`column-content ${isColumnDropActive ? 'is-drag-active' : ''}`}
        onDragOver={handleColumnDragOver}
        onDrop={handleColumnDrop}
        onDragLeave={handleColumnDragLeave}
      >
        {tasks.map(task => (
          <div
            key={task.id}
            className={`column-drop-target ${dragOverTaskId === task.id ? 'is-over' : ''}`}
            onDragOver={(e) => handleCardDragOver(e, task.id)}
            onDragLeave={(e) => handleCardDragLeave(e, task.id)}
            onDrop={(e) => handleCardDrop(e, task.id)}
          >
            <TaskCard
              task={task}
              allLabels={allLabels}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              onUpdate={onUpdateTask}
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
              isBeingDragged={draggingTaskId === task.id}
            />
          </div>
        ))}

        {isAddingTask ? (
          <div className="add-task-form">
            <input
              type="text"
              className="add-task-input"
              placeholder="عنوان وظیفه (اجباری)"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <textarea
              ref={descriptionRef}
              className="add-task-description"
              placeholder="توضیحات وظیفه (اختیاری)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="add-task-meta-inputs">
              <div className="meta-input-group">
                <label>اولویت:</label>
                <select 
                  value={newTaskPriority} 
                  onChange={(e) => setNewTaskPriority(Number(e.target.value))}
                >
                  <option value={Priority.LOW}>کم</option>
                  <option value={Priority.MEDIUM}>متوسط</option>
                  <option value={Priority.HIGH}>زیاد</option>
                </select>
              </div>
              <div className="meta-input-group">
                <label>تاریخ سررسید:</label>
                <input 
                  type="date" 
                  value={newTaskDueDate} 
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="add-task-labels">
              {allLabels.map(label => (
                <button
                  key={label.id}
                  className={`mini-label-btn ${newTaskLabels.some(l => l.id === label.id) ? 'active' : ''}`}
                  onClick={() => handleToggleNewLabel(label)}
                  title={label.name}
                >
                  {label.name}
                </button>
              ))}
            </div>
            <div className="add-task-actions">
              <button className="btn-save-task" onClick={handleAddTask}>افزودن وظیفه</button>
              <button className="btn-cancel-task" onClick={() => setIsAddingTask(false)}>انصراف</button>
            </div>
          </div>
        ) : (
          <button className="btn-add-task" onClick={handleAddClick}>
            + افزودن وظیفه
          </button>
        )}
      </div>
    </div>
  );
};
