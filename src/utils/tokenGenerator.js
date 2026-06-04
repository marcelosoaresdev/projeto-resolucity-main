import { v4 as uuidv4 } from 'uuid';

const TOKEN_EXPIRATION_HOURS = 24;

// Gera um novo confirmation token com timestamp de expiração
function generateConfirmationToken() {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);
    return { token, expiresAt: expiresAt.toISOString() };
}

// Verifica se um token expirou
function isTokenExpired(expiresAt) {
    return new Date(expiresAt) < new Date();
}

export { generateConfirmationToken, isTokenExpired, TOKEN_EXPIRATION_HOURS };