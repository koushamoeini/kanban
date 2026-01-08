# Kanban Task Management Application

A React-based Kanban board application with task management features built with TypeScript.

## Features

- **Task Management**: Create, read, update, and delete tasks
- **Three-Column Board**: To Do, In Progress, Done columns
- **Task Properties**:
  - Title and description
  - Priority levels (Low, Medium, High)
  - Urgency levels (Not Urgent, Medium Urgent, Very Urgent)
  - Labels for categorization
  - Due dates
  
- **Search & Filter**: Search tasks by title or description
- **Sorting**: Sort tasks by priority or due date
- **Persistent Storage**: Tasks saved to browser localStorage
- **Responsive UI**: Clean, intuitive interface

## Project Structure

```
src/
├── components/
│   ├── KanbanBoard.tsx      # Main board component
│   ├── Column.tsx           # Column component for each status
│   ├── TaskCard.tsx         # Individual task card
│   └── Toolbar.tsx          # Search, filter, sort toolbar
├── types.ts                 # TypeScript type definitions
├── taskManager.ts           # Task management logic
├── App.tsx                  # Root app component
└── index.tsx                # Entry point
```

## Installation

```bash
npm install
```

## Running the Application

```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

## Technical Stack

- **React 18** - UI framework
- **TypeScript** - Type safety and better development experience
- **CSS3** - Styling
- **LocalStorage API** - Data persistence

## Rules & Constraints

- Must use React with TypeScript (no JavaScript)
- No Prettier or linters
- CRUD operations for tasks, stories, features, and items
- Delay/Late policy enforcement
- Task completion policies as per documentation

## Usage

1. **Create Task**: Click "+ Add Task" in any column
2. **Edit Task**: Double-click on task title to edit
3. **Delete Task**: Click the × button on task card
4. **Move Task**: Drag tasks between columns (planned feature)
5. **Search**: Use the search bar to find tasks
6. **Filter**: Select labels to filter tasks
7. **Sort**: Choose sorting by priority or due date
