import React, { useState, useEffect } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import './App.css';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app" dir="rtl">
      <KanbanBoard theme={theme} toggleTheme={toggleTheme} />
    </div>
  );
};

export default App;
