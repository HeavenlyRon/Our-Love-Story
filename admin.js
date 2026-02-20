let isLoggedIn = false;
let currentMessages = [];
let currentOpenedMessageId = null;

const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const messagesContainer = document.getElementById('messagesContainer');
const logoutBtn = document.getElementById('logoutBtn');
const messageModal = document.getElementById('messageModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const deleteBtn = document.getElementById('deleteBtn');

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value;

    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok) {
            isLoggedIn = true;
            loginSection.style.display = 'none';
            dashboard.style.display = 'block';
            passwordInput.value = '';
            errorMessage.textContent = '';
            loadMessages();
        } else {
            errorMessage.textContent = data.error || 'Invalid password';
        }
    } catch (error) {
        errorMessage.textContent = 'Connection error. Is the server running?';
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/admin/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    isLoggedIn = false;
    loginSection.style.display = 'flex';
    dashboard.style.display = 'none';
    messagesContainer.innerHTML = '';
    currentMessages = [];
    messageModal.classList.remove('active');
});

// Load Messages
async function loadMessages() {
    try {
        const response = await fetch('/api/admin/messages');
        const data = await response.json();

        if (response.ok) {
            currentMessages = data;
            displayMessages(data);
        }
    } catch (error) {
        messagesContainer.innerHTML = '<p>Failed to load messages</p>';
    }
}

// Display Messages
function displayMessages(messages) {
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<p>No messages yet</p>';
        return;
    }

    messagesContainer.innerHTML = messages.map(msg => `
        <div class="admin-message-card" onclick="openMessage(${msg.id})">
            <div class="admin-message-header">
                <strong>${escapeHtml(msg.name)}</strong>
                <span>${new Date(msg.timestamp).toLocaleDateString()}</span>
            </div>
            <p>${escapeHtml(msg.email)}</p>
            <p>${escapeHtml(msg.message.substring(0, 100))}${msg.message.length > 100 ? '...' : ''}</p>
        </div>
    `).join('');
}

// Open Message Modal
function openMessage(id) {
    const message = currentMessages.find(m => m.id === id);
    if (!message) return;

    currentOpenedMessageId = id;
    document.getElementById('modalName').textContent = escapeHtml(message.name);
    document.getElementById('modalEmail').textContent = escapeHtml(message.email);
    document.getElementById('modalDate').textContent = new Date(message.timestamp).toLocaleString();
    document.getElementById('modalMessage').textContent = escapeHtml(message.message);

    messageModal.classList.add('active');
}

// Close Modal
closeModalBtn.addEventListener('click', () => {
    messageModal.classList.remove('active');
});

messageModal.addEventListener('click', (e) => {
    if (e.target === messageModal) {
        messageModal.classList.remove('active');
    }
});

// Delete Message
deleteBtn.addEventListener('click', async () => {
    if (!currentOpenedMessageId) return;

    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        const response = await fetch(`/api/admin/messages/${currentOpenedMessageId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            messageModal.classList.remove('active');
            loadMessages();
        } else {
            alert('Failed to delete message');
        }
    } catch (error) {
        alert('Error deleting message');
    }
});

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check Auth Status
async function checkAuthStatus() {
    try {
        const response = await fetch('/admin/check-auth');
        const data = await response.json();
        if (data.authenticated) {
            isLoggedIn = true;
            loginSection.style.display = 'none';
            dashboard.style.display = 'block';
            loadMessages();
        }
    } catch (error) {
        console.log('Not authenticated');
    }
}

checkAuthStatus();
