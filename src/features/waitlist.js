import { showToast } from '../ui/toast.js';

const WAITLIST_KEY = 'projectGraveyard_waitlist';

export function setupWaitlist() {
    const waitlistModal = document.getElementById('waitlistModal');
    const waitlistLink = document.getElementById('waitlistLink');
    const modalCloseBtn = document.getElementById('modalClose');
    const waitlistEmail = document.getElementById('waitlistEmail');
    const waitlistSubmit = document.getElementById('waitlistSubmit');
    const waitlistSuccess = document.getElementById('waitlistSuccess');
    const modalForm = document.querySelector('.modal-form');
    const modalFinePrint = document.querySelector('.modal-fine-print');

    // Check if already signed up
    const existingEmail = localStorage.getItem(WAITLIST_KEY);
    if (existingEmail) {
        // Already on the waitlist — update the sidebar link text
        waitlistLink.textContent = '✅ You\'re on the list!';
        waitlistLink.style.pointerEvents = 'none';
        waitlistLink.style.opacity = '0.7';
    }

    waitlistLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (existingEmail) return;
        waitlistModal.classList.remove('hidden');
    });

    modalCloseBtn.addEventListener('click', () => {
        waitlistModal.classList.add('hidden');
    });

    waitlistModal.addEventListener('click', (e) => {
        if (e.target === waitlistModal) {
            waitlistModal.classList.add('hidden');
        }
    });

    waitlistSubmit.addEventListener('click', async () => {
        const email = waitlistEmail.value.trim();
        if (!email || !email.includes('@') || !email.includes('.')) {
            waitlistEmail.classList.add('shake');
            setTimeout(() => waitlistEmail.classList.remove('shake'), 500);
            showToast('💀 Enter a valid email address!');
            return;
        }

        // Disable button and show loading
        const originalText = waitlistSubmit.textContent;
        waitlistSubmit.textContent = 'Joining...';
        waitlistSubmit.disabled = true;

        try {
            const response = await fetch('https://formspree.io/f/xojnkzkk', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            if (response.ok) {
                // Save to localStorage so they don't see the form again
                localStorage.setItem(WAITLIST_KEY, email);

                // Show success state
                modalForm.style.display = 'none';
                modalFinePrint.style.display = 'none';
                waitlistSuccess.classList.remove('hidden');

                // Update sidebar link
                waitlistLink.textContent = '✅ You\'re on the list!';
                waitlistLink.style.pointerEvents = 'none';
                waitlistLink.style.opacity = '0.7';

                showToast('🪦 You\'ve joined the waitlist!');
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Waitlist error:', error);
            showToast('💀 Something went wrong. Try again!');
        } finally {
            waitlistSubmit.textContent = originalText;
            waitlistSubmit.disabled = false;
        }
    });

    // Allow Enter key to submit
    waitlistEmail.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') waitlistSubmit.click();
    });
}
