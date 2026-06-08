import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import userRepository from "../repositories/userRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { generateConfirmationToken } from "../utils/tokenGenerator.js";
import eventBus from '../utils/eventBus.js';

// Helper para verificar senha (deve vir antes do authController)
function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const testHash = crypto.scryptSync(password, salt, 32).toString('hex');
    return hash === testHash;
}

const authController = {

    // Validações de input
    validateName(nome) {
        if (!nome || typeof nome !== 'string') return 'Nome é obrigatório';
        const trimmed = nome.trim();
        if (trimmed.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
        if (trimmed !== nome) return 'Nome não pode ter espaços no início ou fim';
        return null;
    },

    validateEmail(email) {
        if (!email || typeof email !== 'string') return 'E-mail é obrigatório';
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) return 'Digite um e-mail válido';
        return null;
    },

    validateCpf(cpf) {
        if (!cpf || typeof cpf !== 'string') return 'CPF é obrigatório';
        // Remove formatação
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length !== 11) return 'CPF deve ter 11 dígitos';
        // Validação de dígitos verificadores
        if (/^(\d)\1{10}$/.test(cleanCpf)) return 'CPF inválido';

        // Validação do primeiro dígito
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCpf[i]) * (10 - i);
        }
        let digit1 = (sum * 10) % 11;
        if (digit1 === 10) digit1 = 0;
        if (digit1 !== parseInt(cleanCpf[9])) return 'CPF inválido';

        // Validação do segundo dígito
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCpf[i]) * (11 - i);
        }
        let digit2 = (sum * 10) % 11;
        if (digit2 === 10) digit2 = 0;
        if (digit2 !== parseInt(cleanCpf[10])) return 'CPF inválido';

        return null;
    },

    validatePassword(senha) {
        if (!senha || typeof senha !== 'string') return 'Senha é obrigatória';
        if (senha.length < 8) return 'A senha deve ter 8+ caracteres, letra e número';
        if (!/[a-zA-Z]/.test(senha)) return 'A senha deve ter 8+ caracteres, letra e número';
        if (!/[0-9]/.test(senha)) return 'A senha deve ter 8+ caracteres, letra e número';
        if (/\s/.test(senha)) return 'A senha não pode ter espaços';
        return null;
    },

    // POST /api/auth/register
    async register(req, res) {
        const { nome, email, senha } = req.body;

        // Valida campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }

        // Validações
        const nameError = authController.validateName(nome);
        if (nameError) return res.status(400).json({ message: nameError });

        const emailError = authController.validateEmail(email);
        if (emailError) return res.status(400).json({ message: emailError });

        const passwordError = authController.validatePassword(senha);
        if (passwordError) return res.status(400).json({ message: passwordError });

        // Gera confirmation token
        const { token, expiresAt } = generateConfirmationToken();

        // Cria usuário pendente
        const result = userRepository.createUser(nome, email, senha, token, expiresAt);

        if (result.error) {
            return res.status(409).json({ message: result.error });
        }

        // Observers reagem ao evento sem acoplar o controller aos detalhes de envio
        eventBus.publish('user:registered', { email, nome, token });

        res.status(201).json({ message: 'Cadastro realizado! Verifique seu email.', userId: result.newUser.id });
    },

    // GET /api/auth/confirm/:token
    confirm(req, res) {
        const { token } = req.params;

        if (!token) {
            return res.sendFile(path.join(__dirname, '../../public/views/email-confirmar-erro.html'));
        }

        const result = userRepository.activateUser(token);

        if (result.error) {
            return res.sendFile(path.join(__dirname, '../../public/views/email-confirmar-erro.html'));
        }

        res.sendFile(path.join(__dirname, '../../public/views/email-confirmado.html'));
    },

    // POST /api/auth/login
    login(req, res) {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }

        const user = userRepository.findByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos' });
        }

        // Verifica se a senha está em formato antigo (plaintext) ou novo (hash)
        let passwordValid = false;
        if (user.senha.includes(':')) {
            // Novo formato salt:hash
            passwordValid = verifyPassword(senha, user.senha);
        } else {
            // Formato antigo plaintext (compatibilidade)
            passwordValid = (user.senha === senha);
        }

        if (!passwordValid) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos' });
        }

        // Verifica status
        if (user.status === 'pendente_confirmacao') {
            return res.status(401).json({ message: `Faça a confirmação pelo email que enviamos para ${user.email}` });
        }

        if (user.status !== 'ativo') {
            return res.status(401).json({ message: 'Conta não está ativa. Entre em contato com suporte.' });
        }

        // Credenciais corretas e conta ativa
        req.session.userId = user.id;
        req.session.userName = user.nome;

        res.json({ message: 'Login realizado com sucesso', user: { id: user.id, nome: user.nome, email: user.email } });
    },

    // POST /api/auth/logout
    logout(req, res) {
        req.session.destroy(() => {
            res.json({ message: 'Logout realizado' });
        });
    },

    // GET /api/auth/me
    me(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        res.json({ id: req.session.userId, nome: req.session.userName });
    },

    // GET /api/auth/profile
    getProfile(req, res) {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ message: 'Não autenticado' });
        const user = userRepository.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json({ id: user.id, nome: user.nome, email: user.email, cpf: user.cpf, nascimento: user.nascimento, telefone: user.telefone });
    },

    // PUT /api/auth/profile
    updateProfile(req, res) {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ message: 'Não autenticado' });
        const { nome, cpf, nascimento, telefone, email } = req.body;
        if (!nome || !cpf || !nascimento || !telefone || !email) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }
        // Validações
        const nameError = authController.validateName(nome);
        if (nameError) return res.status(400).json({ message: nameError });

        const emailError = authController.validateEmail(email);
        if (emailError) return res.status(400).json({ message: emailError });

        const cpfError = authController.validateCpf(cpf);
        if (cpfError) return res.status(400).json({ message: cpfError });

        const result = userRepository.updateUser(userId, { nome, cpf, nascimento, telefone, email });
        if (result.error) return res.status(400).json({ message: result.error });
        req.session.userName = nome;
        res.json({ message: 'Perfil atualizado', user: result.user });
    },

    // GET /api/auth/
    listUsers(req, res) {
        res.json(userRepository.listUsers());
    }

};

// Helper para verificar senha (importado no login)

export default authController;