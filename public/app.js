// app.js - Frontend JavaScript for Task Manager

const API_URL = 'http://localhost:3000/api/tasks';

// State management
let tasks = [];
let currentFilter = 'all';
let currentPriorityFilter = 'all';
let searchQuery = '';
let editingTaskId = null;

// DOM Elements
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');
const filterButtons = document.querySelectorAll('.filter-btn');
const priorityFilterSelect = document.getElementById('priority-filter');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  taskForm.addEventListener('submit', handleSubmit);
  searchInput.addEventListener('input', handleSearch);
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
  });
  
  priorityFilterSelect.addEventListener('change', handlePriorityFilter);
  cancelBtn.addEventListener('click', cancelEdit);
}

// Load all tasks from API
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
    alert('Failed to load tasks. Please refresh the page.');
  }
}

// Handle form submission (create or update)
async function handleSubmit(e) {
  e.preventDefault();
  
  const taskData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
    due_date: document.getElementById('due-date').value || null,
    status: 'active'
  };
  
  try {
    if (editingTaskId) {
      // Update existing task
      const response = await fetch(`${API_URL}/${editingTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) throw new Error('Failed to update task');
      
      const updatedTask = await response.json();
      tasks = tasks.map(t => t.id === editingTaskId ? updatedTask : t);
      
      cancelEdit();
    } else {
      // Create new task
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) throw new Error('Failed to create task');
      
      const newTask = await response.json();
      tasks.unshift(newTask);
    }
    
    taskForm.reset();
    renderTasks();
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Failed to save task. Please try again.');
  }
}

// Delete task
async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete task');
    
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task. Please try again.');
  }
}

// Toggle task completion
async function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  const newStatus = task.status === 'completed' ? 'active' : 'completed';
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: newStatus })
    });
    
    if (!response.ok) throw new Error('Failed to update task');
    
    const updatedTask = await response.json();
    tasks = tasks.map(t => t.id === id ? updatedTask : t);
    renderTasks();
  } catch (error) {
    console.error('Error updating task:', error);
    alert('Failed to update task. Please try again.');
  }
}

// Edit task - populate form with task data
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  editingTaskId = id;
  
  document.getElementById('title').value = task.title;
  document.getElementById('description').value = task.description || '';
  document.getElementById('priority').value = task.priority;
  document.getElementById('due-date').value = task.due_date || '';
  
  formTitle.textContent = 'Edit Task';
  submitBtn.textContent = 'Update Task';
  cancelBtn.style.display = 'inline-block';
  
  // Scroll to form
  document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Cancel edit mode
function cancelEdit() {
  editingTaskId = null;
  taskForm.reset();
  formTitle.textContent = 'Add New Task';
  submitBtn.textContent = 'Add Task';
  cancelBtn.style.display = 'none';
}

// Handle search
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase();
  renderTasks();
}

// Handle status filter
function handleFilterClick(e) {
  filterButtons.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  currentFilter = e.target.dataset.filter;
  renderTasks();
}

// Handle priority filter
function handlePriorityFilter(e) {
  currentPriorityFilter = e.target.value;
  renderTasks();
}

// Filter tasks based on current filters
function getFilteredTasks() {
  return tasks.filter(task => {
    // Status filter
    const statusMatch = currentFilter === 'all' || task.status === currentFilter;
    
    // Priority filter
    const priorityMatch = currentPriorityFilter === 'all' || task.priority === currentPriorityFilter;
    
    // Search filter
    const searchMatch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery) ||
      (task.description && task.description.toLowerCase().includes(searchQuery));
    
    return statusMatch && priorityMatch && searchMatch;
  });
}

// Render tasks to DOM
function renderTasks() {
  const filteredTasks = getFilteredTasks();
  
  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-card ${task.status} priority-${task.priority}">
      <div class="task-header">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <span class="task-priority priority-${task.priority}">${task.priority}</span>
      </div>
      
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      
      <div class="task-meta">
        ${task.due_date ? `<span>📅 Due: ${formatDate(task.due_date)}</span>` : ''}
        <span>📌 Status: ${task.status}</span>
      </div>
      
      <div class="task-actions">
        <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
        <button class="complete-btn" onclick="toggleComplete(${task.id})">
          ${task.status === 'completed' ? 'Reactivate' : 'Complete'}
        </button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Utility: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
