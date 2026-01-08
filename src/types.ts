export enum TaskStatus {
  TODO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export interface Label {
  id: string;
  name: string;
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  labels: Label[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  order: number;
}

export interface Column {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}
