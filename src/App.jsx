import React, { useEffect, useRef, useState } from "react";
import "./App.css";

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [theme, setTheme] = useLocalStorage("theme", prefersDark ? "dark" : "light");
  const [tasks, setTasks] = useLocalStorage("tasks", []);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [announce, setAnnounce] = useState("");
  const inputRef = useRef(null);
  const editRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editingId) editRef.current?.focus();
  }, [editingId]);

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  function addTask(e) {
    e?.preventDefault();
    const text = newTask.trim();
    if (!text) return;
    const next = { id: uid(), text, completed: false };
    setTasks([next, ...tasks]);
    setNewTask("");
    setAnnounce(`Added task: ${text}`);
    inputRef.current?.focus();
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function beginEdit(id) {
    const t = tasks.find((x) => x.id === id);
    setEditingId(id);
    setEditingText(t?.text || "");
  }

  function saveEdit(e) {
    e.preventDefault();
    const text = editingText.trim();
    if (!text) {
      setEditingId(null);
      inputRef.current?.focus();
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, text } : t)));
    setAnnounce(`Edited task: ${text}`);
    setEditingId(null);
    inputRef.current?.focus();
  }

  function cancelEdit() {
    setEditingId(null);
    inputRef.current?.focus();
  }

  function removeTask(id) {
    const t = tasks.find((x) => x.id === id);
    setTasks((prev) => prev.filter((x) => x.id !== id));
    setAnnounce(`Deleted task: ${t?.text || "task"}`);
  }

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "monokai", label: "Monokai" },
    { value: "apple", label: "Apple" },
    { value: "purple-dark", label: "Purple Dark" },
    { value: "cyan", label: "Cyan" }
  ];

  return (
    <>
      <header className="site-header" role="banner" aria-label="Header">
        <div className="brand">
          <div className="logo" aria-hidden="true">Z</div>
          <span className="brand-name">Tasks</span>
        </div>
        <div className="theme-picker">
          <label htmlFor="theme">Theme</label>
          <select id="theme" aria-label="Select theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {themeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </header>

      <main id="main" className="shell" role="main" aria-labelledby="app-title">
        <section className="card">
          <h1 id="app-title" className="title">Task Manager</h1>

          <form className="add-row" onSubmit={addTask} aria-label="Add task">
            <div className="field">
              <label htmlFor="new-task" className="label">Task</label>
              <input
                id="new-task"
                ref={inputRef}
                type="text"
                placeholder="Describe your task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <button type="submit" className="btn primary">Add</button>
          </form>

          <div className="progress-wrap">
            <div className="progress-head" id="progress-label">
              <span>Progress</span>
              <span className="progress-count" aria-live="polite">{completed}/{total || 1}</span>
            </div>
            <progress
              className="progress"
              max={Math.max(total, 1)}
              value={total === 0 ? 0 : completed}
              aria-describedby="progress-label"
            />
          </div>

          <ul className="list" role="list" aria-label="Tasks">
            {tasks.map((t) => (
              <li key={t.id} className="row" role="listitem">
                <div className="row-main">
                  <input
                    id={`check-${t.id}`}
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTask(t.id)}
                    aria-label={t.completed ? `Mark "${t.text}" as incomplete` : `Mark "${t.text}" as complete`}
                  />
                  {editingId === t.id ? (
                    <form className="edit" onSubmit={saveEdit}>
                      <label htmlFor={`edit-${t.id}`} className="sr-only">Edit task</label>
                      <input
                        id={`edit-${t.id}`}
                        ref={editRef}
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), cancelEdit())}
                        aria-describedby={`help-${t.id}`}
                      />
                      <div id={`help-${t.id}`} className="help">Enter to save, Esc to cancel</div>
                      <div className="edit-actions">
                        <button type="submit" className="btn primary small">Save</button>
                        <button type="button" className="btn ghost small" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <label htmlFor={`check-${t.id}`} className={`text ${t.completed ? "done" : ""}`}>{t.text}</label>
                  )}
                </div>
                {editingId !== t.id && (
                  <div className="row-actions">
                    <button type="button" className="btn ghost" onClick={() => beginEdit(t.id)} aria-label={`Edit ${t.text}`}>Edit</button>
                    <button type="button" className="btn danger" onClick={() => removeTask(t.id)} aria-label={`Delete ${t.text}`}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="sr-only" role="status" aria-live="polite">{announce}</div>
        </section>
      </main>
    </>
  );
}