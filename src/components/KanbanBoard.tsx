import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Label, Priority } from '../types';
import { taskManager } from '../taskManager';
import { Column } from './Column';
import { Toolbar } from './Toolbar';
import { Modal } from './Modal';
import { TaskEditModal } from './TaskEditModal';
import './KanbanBoard.css';

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
  const [columns, setColumns] = useState<{id: string, title: string}[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // Modal States
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<{id: string, title: string} | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [deleteTaskDestination, setDeleteTaskDestination] = useState<string | 'delete'>('delete');
  const [isAddingNewCol, setIsAddingNewCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  const loadTasks = (): void => {
    const allTasks = taskManager.getAllTasks();
    const currentCols = taskManager.getColumns();
    setColumns(currentCols);
    
    // Sort tasks based on current order and column sequence
    const sorted = [...allTasks].sort((a, b) => {
      if (a.status === b.status) {
        return a.order - b.order;
      }
      const indexA = currentCols.findIndex(c => c.id === a.status);
      const indexB = currentCols.findIndex(c => c.id === b.status);
      return indexA - indexB;
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

  const handleUpdateColumnTitle = (id: string, newTitle: string): void => {
    taskManager.updateColumnTitle(id, newTitle);
    setEditingColumn(null);
    loadTasks();
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

    const targetColumnTasks = tasks.filter(t => t.status === targetStatus);
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
      const sourceColumnTasks = tasks.filter(t => t.status === sourceStatus);
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

  const handleAddNewColumn = (): void => {
    if (newColTitle.trim()) {
      taskManager.addColumn(newColTitle.trim());
      setNewColTitle('');
      setIsAddingNewCol(false);
      loadTasks();
    }
  };

  const handleConfirmDeleteColumn = (): void => {
    if (columnToDelete) {
      const target = deleteTaskDestination === 'delete' ? undefined : deleteTaskDestination;
      taskManager.deleteColumn(columnToDelete, target);
      setColumnToDelete(null);
      setDeleteTaskDestination('delete');
      loadTasks();
    }
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
        availableColumns={[]} 
        onAddColumn={() => setIsAddingNewCol(true)}
        onAddLabel={handleAddLabel}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="board-container">
        {columns.map(col => (
          <Column
            key={col.id}
            status={col.id}
            title={col.title}
            tasks={getTasksByStatus(col.id)}
            allLabels={allLabels}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onEditColumn={(status, title) => setEditingColumn({id: status, title})}
            onUpdateTask={handleUpdateTask}
            onTaskDrop={handleTaskDrop}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            draggingTaskId={draggingTaskId}
            onRemoveColumn={(id) => setColumnToDelete(id)}
            isColumnRemovable={columns.length > 1}
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

      {/* Add New Column Modal */}
      <Modal
        isOpen={isAddingNewCol}
        onClose={() => setIsAddingNewCol(false)}
        title="افزودن ستون جدید"
      >
        <div className="edit-form">
          <div className="form-group" style={{direction: 'rtl'}}>
            <label>نام ستون جدید</label>
            <input 
              type="text" 
              value={newColTitle} 
              onChange={(e) => setNewColTitle(e.target.value)}
              placeholder="مثلاً: در حال بررسی"
              autoFocus
            />
            <div className="form-actions" style={{marginTop: '20px'}}>
              <button className="btn-save" onClick={handleAddNewColumn}>ایجاد</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Column Title Modal */}
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
                  onClick={() => handleUpdateColumnTitle(editingColumn.id, editingColumn.title)}
                >
                  ذخیره
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Column Confirmation Modal */}
      <Modal
        isOpen={!!columnToDelete}
        onClose={() => setColumnToDelete(null)}
        title="حذف ستون"
      >
        {columnToDelete && (
          <div className="edit-form" style={{direction: 'rtl'}}>
            <p>آیا از حذف ستون "{columns.find(c => c.id === columnToDelete)?.title}" اطمینان دارید؟</p>
            
            <div className="form-group" style={{marginTop: '15px'}}>
              <label>تکلیف وظایف موجود در این ستون:</label>
              <select 
                value={deleteTaskDestination} 
                onChange={(e) => setDeleteTaskDestination(e.target.value)}
                style={{width: '100%', padding: '8px', border: 'var(--border-width) solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)'}}
              >
                <option value="delete">حذف تمام وظایف این ستون</option>
                {columns
                  .filter(c => c.id !== columnToDelete)
                  .map(c => (
                    <option key={c.id} value={c.id}>انتقال به ستون: {c.title}</option>
                  ))}
              </select>
            </div>

            <div className="form-actions" style={{marginTop: '20px'}}>
              <button className="btn-save" style={{background: '#ff4444', color: 'white'}} onClick={handleConfirmDeleteColumn}>
                تأیید و حذف
              </button>
              <button className="btn-cancel" style={{marginRight: '10px'}} onClick={() => setColumnToDelete(null)}>
                انصراف
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
