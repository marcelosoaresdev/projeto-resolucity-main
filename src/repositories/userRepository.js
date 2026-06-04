import fs from 'fs';
import crypto from 'crypto';

const DB_PATH = './src/database/users.json';
const SALT_LENGTH = 16;

// Helper: gera salt aleatório
function generateSalt() {
    return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

// Helper: hash scrypt com salt
function hashPassword(password, salt) {
    const hash = crypto.scryptSync(password, salt, 32);
    return `${salt}:${hash.toString('hex')}`;
}

// Helper: verifica senha
function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const testHash = crypto.scryptSync(password, salt, 32).toString('hex');
    return hash === testHash;
}

const userRepository = {

    createUser: (nome, email, senha, confirmationToken, confirmationExpiresAt) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { error: 'Este e-mail já está cadastrado' };
        }

        const hashedPassword = hashPassword(senha, generateSalt());

        // Gera próximo ID baseado no maior ID existente
        const maxId = users.reduce((max, u) => Math.max(max, u.id || 0), 0);

        const newUser = {
            id: maxId + 1,
            nome,
            email,
            senha: hashedPassword,
            status: 'pendente_confirmacao',
            confirmationToken,
            confirmationExpiresAt,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return { newUser, message: 'Cadastro realizado! Verifique seu email.' };
    },

    findByEmail: (email) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    findById: (id) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.id === id) || null;
    },

    findByConfirmationToken: (token) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.confirmationToken === token) || null;
    },

    activateUser: (token) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const idx = users.findIndex(u => u.confirmationToken === token);
        if (idx === -1) return { error: 'Link inválido.' };

        const user = users[idx];
        if (user.status === 'ativo') return { error: 'Link já utilizado. Faça login normalmente.' };
        if (new Date(user.confirmationExpiresAt) < new Date()) return { error: 'Link expirado. Solicite um novo.' };

        users[idx] = {
            ...users[idx],
            status: 'ativo',
            confirmationToken: null,
            confirmationExpiresAt: null
        };

        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return { user: users[idx], message: 'Conta ativada com sucesso!' };
    },

    updateUser: (id, data) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) return { error: 'Usuário não encontrado' };
        users[idx] = { ...users[idx], ...data };
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return { user: users[idx] };
    },

    listUsers: () => {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
};

export default userRepository;