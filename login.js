document.addEventListener('DOMContentLoaded', () => {
    // Check for existing session
    const checkExistingSession = () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.isLoggedIn) {
            window.location.href = 'index.html';
        }
    };

    // Log all users in localStorage
    console.log('=== Login Page - LocalStorage Contents ===');
    console.log('All Users:', JSON.parse(localStorage.getItem('users')));
    console.log('Current User:', JSON.parse(localStorage.getItem('currentUser')));
    console.log('=======================================');

    // Check existing session
    checkExistingSession();

    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginError = document.getElementById('loginError');
    const signupError = document.getElementById('signupError');

    // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        console.log('Login attempt:', { email, password });
        console.log('Available users:', users);

        // Find user with matching email and password
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Set current user and login status
            const currentUser = {
                ...user,
                isLoggedIn: true,
                // Initialize conversationCredits if it's undefined or null
                conversationCredits: user.conversationCredits === undefined || user.conversationCredits === null ? 10 : user.conversationCredits,
                plan: user.plan || 'free' // Load existing plan or default to 'free'
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('Login successful:', currentUser);
            window.location.href = 'index.html';
        } else {
            console.log('Login failed: Invalid email or password');
            loginError.textContent = 'Invalid email or password';
            document.getElementById('loginEmail').classList.add('error');
            document.getElementById('loginPassword').classList.add('error');
        }
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        // Get existing users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        console.log('Signup attempt:', { name, email, password });
        console.log('Existing users:', users);

        // Check if email already exists
        if (users.some(user => user.email === email)) {
            console.log('Signup failed: Email already exists');
            signupError.textContent = 'Email already exists';
            document.getElementById('signupEmail').classList.add('error');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            console.log('Signup failed: Passwords do not match');
            signupError.textContent = 'Passwords do not match';
            document.getElementById('signupPassword').classList.add('error');
            document.getElementById('signupConfirmPassword').classList.add('error');
            return;
        }

        // Create new user
        const newUser = {
            name,
            email,
            password,
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
            conversationCredits: 10, // Assign 10 free credits to new users
            plan: 'free' // Assign 'free' plan to new users
        };

        // Add to users array and save
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        console.log('Signup successful:', newUser);
        window.location.href = 'index.html';
    });

    // Tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetForm = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetForm}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            // Update icon
            const icon = button.querySelector('svg');
            if (type === 'text') {
                icon.innerHTML = '<path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
            } else {
                icon.innerHTML = '<path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
            }
        });
    });

    // Input validation
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            const errorElement = input.closest('form').querySelector('.auth-error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
    });
}); 