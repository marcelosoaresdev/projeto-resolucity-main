import fs from 'fs';

const DB_PATH = './src/database/users.json';

const userRepository = {
    createUser: (nome, email, senha) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { error: 'Este e-mail já está cadastrado' };
        }

        const newUser = {
            id: users.length + 1,
            nome,
            email,
            senha // plaintext por enquanto (apenas para testes)
        };
        users.push(newUser);
        // JSON.stringify(valor, replacer, espaços)
        // - null: sem filtro de campos (salva tudo)
        // - 2: indenta o arquivo com 2 espaços, deixando legível para humanos
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return { newUser, message: 'Usuário criado com sucesso!' };
    },

    findByEmail: (email) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    findById: (id) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.id === id) || null;
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
