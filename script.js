// Initialize data from localStorage or set defaults
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let lastCompletedDate = localStorage.getItem('lastCompletedDate');
let streakCount = parseInt(localStorage.getItem('streakCount')) || 0;
let userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
let userXP = parseInt(localStorage.getItem('userXP')) || 0;

// XP required for each level (increases by 50% each level)
function getRequiredXP(level) {
    return Math.round(100 * Math.pow(1.5, level - 1));
}

// Function to update localStorage
function updateLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('lastCompletedDate', lastCompletedDate);
    localStorage.setItem('streakCount', streakCount);
    localStorage.setItem('userLevel', userLevel);
    localStorage.setItem('userXP', userXP);
}

// Function to update XP bar
function updateXPBar() {
    const requiredXP = getRequiredXP(userLevel);
    const progress = (userXP / requiredXP) * 100;
    document.getElementById('xp-progress').style.width = `${progress}%`;
    document.getElementById('xp-text').textContent = `${userXP}/${requiredXP} XP`;
    document.getElementById('level').textContent = userLevel;
}

// Function to check level up
function checkLevelUp() {
    const requiredXP = getRequiredXP(userLevel);
    if (userXP >= requiredXP) {
        userXP -= requiredXP;
        userLevel++;
        showLevelUpModal();
        updateXPBar();
        updateLocalStorage();
    }
}

// Function to show level up modal
function showLevelUpModal() {
    const modal = document.getElementById('levelUpModal');
    document.getElementById('newLevel').textContent = userLevel;
    modal.style.display = 'flex';
}

// Function to close modal
function closeModal() {
    document.getElementById('levelUpModal').style.display = 'none';
}

// Function to add a new task
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const xpInput = document.getElementById('xpInput');
    const taskText = taskInput.value.trim();
    const xpValue = parseInt(xpInput.value);
    
    if (taskText !== '' && !isNaN(xpValue) && xpValue > 0) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            date: new Date().toLocaleDateString(),
            xp: xpValue
        };
        
        tasks.push(task);
        updateLocalStorage();
        renderTasks();
        taskInput.value = '';
        xpInput.value = '10';
    }
}

// Function to delete task
function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.completed) {
        userXP -= task.xp;
        if (userXP < 0) userXP = 0;
        updateXPBar();
    }
    tasks = tasks.filter(task => task.id !== taskId);
    updateLocalStorage();
    renderTasks();
    updateStreak();
}

// Function to toggle task completion
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            userXP += task.xp;
            checkLevelUp();
        } else {
            userXP -= task.xp;
            if (userXP < 0) userXP = 0;
        }
        updateStreak();
        updateXPBar();
        updateLocalStorage();
        renderTasks();
    }
}

// Function to update streak
function updateStreak() {
    const today = new Date().toLocaleDateString();
    const todaysTasks = tasks.filter(task => task.date === today);
    const hasCompletedTaskToday = todaysTasks.some(task => task.completed);

    if (hasCompletedTaskToday) {
        if (!lastCompletedDate) {
            streakCount = 1;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toLocaleDateString();

            if (lastCompletedDate === yesterdayString) {
                streakCount++;
            } else if (lastCompletedDate !== today) {
                streakCount = 1;
            }
        }
        lastCompletedDate = today;
    } else {
        // Check if streak should be reset
        if (lastCompletedDate) {
            const lastDate = new Date(lastCompletedDate);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
                streakCount = 0;
                lastCompletedDate = null;
            }
        }
    }

    document.getElementById('streak-count').textContent = streakCount;
    updateLocalStorage();
}

// Function to render tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    const today = new Date().toLocaleDateString();
    const todaysTasks = tasks.filter(task => task.date === today);
    
    todaysTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        
        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox" 
                ${task.completed ? 'checked' : ''} 
                onclick="toggleTask(${task.id})">
            <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
            <span class="xp-value">+${task.xp} XP</span>
            <span class="task-delete" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </span>
        `;
        
        taskList.appendChild(taskElement);
    });
    
    // Update statistics
    const completedTasks = todaysTasks.filter(task => task.completed);
    document.getElementById('tasksCompleted').textContent = completedTasks.length;
    document.getElementById('totalTasks').textContent = todaysTasks.length;
    document.getElementById('xpGained').textContent = completedTasks.reduce((sum, task) => sum + task.xp, 0);
}

// Add event listener for Enter key
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Check for streak reset at midnight
function checkForNewDay() {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        updateStreak();
    }
}

// Check every minute for day change
setInterval(checkForNewDay, 60000);

// Initial render
renderTasks();
updateStreak();
updateXPBar();