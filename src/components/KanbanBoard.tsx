import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Label, Priority } from '../types';
import { taskManager } from '../taskManager';
import { Column } from './Column';
import { Toolbar } from './Toolbar';
import { Modal } from './Modal';
import { TaskEditModal } from './TaskEditModal';
import './KanbanBoard.css';

const COLUMN_TITLES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'در دست اقدام',
  [TaskStatus.IN_PROGRESS]: 'در دست انجام',
  [TaskStatus.DONE]: 'انجام شده'
};

const ALL_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE
];

interface KanbanBoardProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ theme, toggleTheme }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'none'>('none');
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<TaskStatus[]>(ALL_STATUSES);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // Modal States
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<{status: TaskStatus, title: string} | null>(null);
  const [customColumnTitles, setCustomColumnTitles] = useState<Record<TaskStatus, string>>(COLUMN_TITLES);

  const loadTasks = (): void => {
    const allTasks = taskManager.getAllTasks();
    const sorted = [...allTasks].sort((a, b) => {
      if (a.status === b.status) {
        return a.order - b.order;
      }
      return ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status);
    });
    setTasks(sorted);
    setAllLabels(taskManager.getLabels());
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    let result = [...tasks];
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    if (selectedLabels.length > 0) {
      result = result.filter(task =>
        task.labels.some(label => selectedLabels.includes(label.id))
      );
    }

    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }

    if (sortBy === 'priority') {
      result.sort((a, b) => b.priority - a.priority);
    } else if (sortBy === 'dueDate') {
      result.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      });
    } else {
      result.sort((a, b) => {
        if (a.status === b.status) {
          return a.order - b.order;
        }
        return 0;
      });
    }

    setFilteredTasks(result);
  }, [tasks, searchQuery, selectedLabels, sortBy, filterPriority]);

  const handleAddTask = (
    title: string, 
    status: TaskStatus, 
    description: string = '', 
    labels: Label[] = [],
    priority: Priority = Priority.MEDIUM,
    dueDate?: Date
  ): void => {
    taskManager.createTask(title, description, status, priority, labels, dueDate);
    loadTasks();
  };

  const handleAddLabel = (name: string, color?: string): void => {
    taskManager.addLabel(name, color);
    loadTasks();
  };

  const handleDeleteTask = (taskId: string): void => {
    taskManager.deleteTask(taskId);
    loadTasks();
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>): void => {
    taskManager.updateTask(taskId, updates);
    loadTasks();
    if (editingTask && editingTask.id === taskId) {
      setEditingTask(null);
    }
  };

  const handleUpdateColumnTitle = (status: TaskStatus, newTitle: string): void => {
    setCustomColumnTitles(prev => ({...prev, [status]: newTitle}));
    setEditingColumn(null);
  };

  const handleTaskDragStart = (taskId: string): void => {
    setDraggingTaskId(taskId);
  };

  const handleTaskDragEnd = (): void => {
    setDraggingTaskId(null);
  };

  const handleTaskDrop = (
    sourceId: string,
    targetStatus: TaskStatus,
    targetTaskId?: string
  ): void => {
    const sourceTask = taskManager.getTask(sourceId);
    if (!sourceTask) {
      return;
    }

    const sourceStatus = sourceTask.status;
    if (sourceStatus === targetStatus && sourceId === targetTaskId) {
      return;
    }

    const targetColumnTasks = taskManager.getTasksByStatus(targetStatus);
    const orderedIds = targetColumnTasks.map(task => task.id);

    let insertIndex = orderedIds.length;
    if (typeof targetTaskId === 'string') {
      const index = orderedIds.indexOf(targetTaskId);
      insertIndex = index === -1 ? orderedIds.length : index;
    }

    if (sourceStatus === targetStatus) {
      const existingIndex = orderedIds.indexOf(sourceId);
      if (existingIndex !== -1) {
        orderedIds.splice(existingIndex, 1);
        if (existingIndex < insertIndex) {
          insertIndex -= 1;
        }
      }
    }

    orderedIds.splice(insertIndex, 0, sourceId);

    if (sourceStatus !== targetStatus) {
      taskManager.moveTask(sourceId, targetStatus);
    }

    taskManager.setTaskOrder(targetStatus, orderedIds);

    if (sourceStatus !== targetStatus) {
      const sourceColumnTasks = taskManager.getTasksByStatus(sourceStatus);
      taskManager.setTaskOrder(
        sourceStatus,
        sourceColumnTasks.map(task => task.id)
      );
    }

    setDraggingTaskId(null);
    loadTasks();
  };

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return filteredTasks.filter(task => task.status === status);
  };

  const availableColumns = ALL_STATUSES.filter(status => !visibleColumns.includes(status));

  const handleAddColumn = (status: TaskStatus): void => {
    setVisibleColumns(prev => (prev.includes(status) ? prev : [...prev, status]));
  };

  const handleRemoveColumn = (status: TaskStatus): void => {
    if (visibleColumns.length <= 1) return;

    const remainingColumns = visibleColumns.filter(item => item !== status);
    const targetStatus = remainingColumns[0]; // Move to the first available column

    const columnTasks = tasks.filter(task => task.status === status);
    columnTasks.forEach(task => {
      taskManager.moveTask(task.id, targetStatus);
    });

    setVisibleColumns(remainingColumns);
    loadTasks();
  };

  return (
    <div className="kanban-board">
      <Toolbar
        searchQuery={searchQuery}
        filterPriority={filterPriority}
        onPriorityFilterChange={setFilterPriority}
        onSearchChange={setSearchQuery}
        allLabels={allLabels}
        selectedLabels={selectedLabels}
        onLabelsChange={setSelectedLabels}
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableColumns={availableColumns}
        onAddColumn={handleAddColumn}
        onAddLabel={handleAddLabel}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="board-container">
        {visibleColumns.map(status => (
          <Column
            key={status}
            status={status}
            title={customColumnTitles[status]}
            tasks={getTasksByStatus(status)}
            allLabels={allLabels}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onEditColumn={(status, title) => setEditingColumn({status, title})}
            onUpdateTask={handleUpdateTask}
            onTaskDrop={handleTaskDrop}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            draggingTaskId={draggingTaskId}
            onRemoveColumn={handleRemoveColumn}
            isColumnRemovable={visibleColumns.length > 1}
          />
        ))}
      </div>

      <Modal 
        isOpen={!!editingTask} 
        onClose={() => setEditingTask(null)} 
        title="ویرایش وظیفه"
      >
        {editingTask && (
          <TaskEditModal 
            task={editingTask} 
            allLabels={allLabels} 
            onSave={handleUpdateTask} 
          />
        )}
      </Modal>

      <Modal
        isOpen={!!editingColumn}
        onClose={() => setEditingColumn(null)}
        title="ویرایش ستون"
      >
        {editingColumn && (
          <div className="edit-form">
            <div className="form-group" style={{direction: 'rtl'}}>
              <label>نام ستون</label>
              <input 
                type="text" 
                value={editingColumn.title} 
                onChange={(e) => setEditingColumn({...editingColumn, title: e.target.value})}
                autoFocus
              />
              <div className="form-actions" style={{marginTop: '20px'}}>
                <button 
                  className="btn-save" 
                  onClick={() => handleUpdateColumnTitle(editingColumn.status, editingColumn.title)}
                >
                  ذخیره
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
