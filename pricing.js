document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update UI based on subscription status
    updateSubscriptionUI();

    // Handle subscription button clicks
    document.querySelectorAll('.plan-cta').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!token) {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
                return;
            }

            const plan = e.target.closest('.pricing-card').querySelector('.plan-title').textContent.toLowerCase();
            if (plan === 'free') {
                window.location.href = 'index.html';
                return;
            }

            try {
                // Create Stripe Checkout Session
                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ plan })
                });

                const { sessionId } = await response.json();

                // Load Stripe
                const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY'); // Replace with your Stripe publishable key

                // Redirect to Stripe Checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: sessionId
                });

                if (result.error) {
                    alert(result.error.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    });

    function updateSubscriptionUI() {
        const subscription = user.subscription || 'free';
        
        // Update button states
        document.querySelectorAll('.plan-cta').forEach(button => {
            const plan = button.closest('.pricing-card').querySelector('.plan-title').textContent.toLowerCase();
            
            if (plan === subscription) {
                button.textContent = 'Current Plan';
                button.disabled = true;
            } else if (plan === 'free') {
                button.textContent = 'Get Started';
                button.disabled = false;
            } else {
                button.textContent = 'Upgrade';
                button.disabled = false;
            }
        });

        // Update feature availability
        document.querySelectorAll('.pricing-card').forEach(card => {
            const plan = card.querySelector('.plan-title').textContent.toLowerCase();
            const features = card.querySelectorAll('li');
            
            features.forEach(feature => {
                const isAvailable = feature.textContent.startsWith('✅');
                if (isAvailable && plan !== 'free') {
                    feature.style.opacity = subscription === 'free' ? '0.5' : '1';
                }
            });
        });
    }

    // Check URL parameters for payment status
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const plan = urlParams.get('plan');

    if (success === 'true' && plan) {
        // Update local storage with new subscription
        user.subscription = plan;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update UI
        updateSubscriptionUI();
        
        // Show success message
        alert('Subscription successful! Welcome to the ' + plan + ' plan!');
        
        // Remove URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'false') {
        alert('Payment was canceled. Please try again when you\'re ready.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}); 