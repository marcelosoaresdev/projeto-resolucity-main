import eventBus from '../utils/eventBus.js';
import { sendConfirmationEmail } from '../utils/emailService.js';

let initialized = false;

function registerUserRegisteredObserver() {
    if (initialized) {
        return;
    }

    initialized = true;

    eventBus.subscribe('user:registered', async ({ email, nome, token }) => {
        if (!email || !nome || !token) {
            return;
        }

        try {
            await sendConfirmationEmail(email, nome, token);
        } catch (error) {
            console.error('Erro ao enviar email de confirmação:', error);
        }
    });
}

registerUserRegisteredObserver();

export default registerUserRegisteredObserver;