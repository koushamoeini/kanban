import { Task, TaskStatus, Priority, Label } from './types';

const STORAGE_KEY = 'kanban_tasks';
const LABELS_KEY = 'kanban_labels';
const COLUMNS_KEY = 'kanban_columns';

interface ColumnInfo {
  id: string;
  title: string;
}

class TaskManager {
  private tasks: Task[] = [];
  private labels: Label[] = [];
  private columns: ColumnInfo[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedColumns = localStorage.getItem(COLUMNS_KEY);
    if (storedColumns) {
      try {
        this.columns = JSON.parse(storedColumns);
      } catch (e) {
        console.error('Failed to load columns', e);
      }
    }
    
    // Initial columns if empty
    if (this.columns.length === 0) {
      this.columns = [
        { id: 'TO_DO', title: 'در دست اقدام' },
        { id: 'IN_PROGRESS', title: 'در دست انجام' },
        { id: 'DONE', title: 'انجام شده' }
      ];
    }

    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      try {
        const parsed = JSON.parse(storedTasks);
        this.tasks = parsed.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          deletedAt: task.deletedAt ? new Date(task.deletedAt) : undefined,
          order: typeof task.order === 'number' ? task.order : 0
        }));
      } catch (e) {
        console.error('Failed to load tasks from storage', e);
        this.tasks = [];
      }
    }

    const storedLabels = localStorage.getItem(LABELS_KEY);
    if (storedLabels) {
      try {
        this.labels = JSON.parse(storedLabels);
      } catch (e) {
        console.error('Failed to load labels from storage', e);
        this.labels = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    localStorage.setItem(LABELS_KEY, JSON.stringify(this.labels));
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(this.columns));
  }

  getColumns(): ColumnInfo[] {
    return this.columns;
  }

  addColumn(title: string): ColumnInfo {
    const id = `col_${Date.now()}`;
    const newCol = { id, title };
    this.columns.push(newCol);
    this.saveToStorage();
    return newCol;
  }

  updateColumnTitle(id: string, title: string): void {
    const col = this.columns.find(c => c.id === id);
    if (col) {
      col.title = title;
      this.saveToStorage();
    }
  }

  deleteColumn(columnId: string, targetColumnId?: string): void {
    // Remove the column definition
    this.columns = this.columns.filter(c => c.id !== columnId);

    if (targetColumnId) {
      // Move tasks to target column
      this.tasks.forEach(task => {
        if (task.status === columnId) {
          task.status = targetColumnId;
          task.updatedAt = new Date();
        }
      });
    } else {
      // Delete tasks associated with this column
      this.tasks = this.tasks.filter(task => task.status !== columnId);
    }

    this.saveToStorage();
  }

  createTask(
    title: string,
    description: string = '',
    status: TaskStatus = 'TO_DO',
    priority: Priority = Priority.MEDIUM,
    labels: Label[] = [],
    dueDate?: Date
  ): Task {
    const task: Task = {
      id: this.generateId(),
      title,
      description,
      status,
      priority,
      labels,
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: this.getNextOrder(status)
    };
    this.tasks.push(task);
    this.saveToStorage();
    return task;
  }

  getLabels(): Label[] {
    return this.labels;
  }

  addLabel(name: string, color?: string): Label {
    const label: Label = {
      id: this.generateId(),
      name,
      color: color || '#6366f1'
    };
    this.labels.push(label);
    this.saveToStorage();
    return label;
  }

  deleteLabel(id: string): void {
    this.labels = this.labels.filter(l => l.id !== id);
    // Remove label from all tasks too
    this.tasks.forEach(task => {
      task.labels = task.labels.filter(l => l.id !== id);
    });
    this.saveToStorage();
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id && !task.deletedAt);
  }

  getAllTasks(): Task[] {
    return this.tasks.filter(task => !task.deletedAt);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks
      .filter(task => task.status === status && !task.deletedAt)
      .sort((a, b) => a.order - b.order);
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.getTask(id);
    if (!task) return undefined;

    Object.assign(task, updates, { updatedAt: new Date() });
    this.saveToStorage();
    return task;
  }

  deleteTask(id: string): boolean {
    const task = this.getTask(id);
    if (!task) return false;

    task.deletedAt = new Date();
    this.saveToStorage();
    return true;
  }

  moveTask(taskId: string, newStatus: TaskStatus, order?: number): Task | undefined {
    const updates: Partial<Task> = { status: newStatus };
    if (typeof order === 'number') {
      updates.order = order;
    }
    return this.updateTask(taskId, updates);
  }

  setTaskOrder(status: TaskStatus, orderedIds: string[]): void {
    const columnTasks = this.tasks.filter(
      task => task.status === status && !task.deletedAt
    );

    const validIds = orderedIds.filter(id =>
      columnTasks.some(task => task.id === id)
    );

    validIds.forEach((id, index) => {
      const task = this.tasks.find(entry => entry.id === id);
      if (task) {
        task.order = index;
        task.updatedAt = new Date();
      }
    });

    this.saveToStorage();
  }

  filterTasksByLabel(labelId: string): Task[] {
    return this.getAllTasks().filter(task =>
      task.labels.some(label => label.id === labelId)
    );
  }

  searchTasks(query: string): Task[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTasks().filter(task =>
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.description && task.description.toLowerCase().includes(lowerQuery))
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNextOrder(status: TaskStatus): number {
    const columnTasks = this.tasks.filter(
      task => task.status === status && !task.deletedAt
    );
    if (columnTasks.length === 0) {
      return 0;
    }
    return (
      Math.max(...columnTasks.map(task => (typeof task.order === 'number' ? task.order : 0))) + 1
    );
  }
}

export const taskManager = new TaskManager();
