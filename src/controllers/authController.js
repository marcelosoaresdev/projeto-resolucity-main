import userRepository from "../repositories/userRepository.js";

const authController = {

    // Cadastro de novo usuário
    register(req, res) {
        const { nome, email, senha } = req.body;

        // Validação: todos os campos são obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }

        const result = userRepository.createUser(nome, email, senha);

        // Se o repository retornou um erro (ex: email duplicado), repassa pro frontend
        if (result.error) {
            return res.status(409).json({ message: result.error });
        }

        res.status(201).json(result);
    },

    // Login: verifica email e senha, cria sessão
    login(req, res) {
        const { email, senha } = req.body;

        // Validação: campos obrigatórios
        if (!email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }

        // Busca o usuário pelo email no banco
        const user = userRepository.findByEmail(email);

        // Se não achou o email OU a senha não bate — mesma mensagem para os dois casos
        // (não informamos qual está errado, por segurança)
        if (!user || user.senha !== senha) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos' });
        }

        // Credenciais corretas: salva os dados do usuário na sessão
        req.session.userId   = user.id;
        req.session.userName = user.nome;

        res.json({ message: 'Login realizado com sucesso', user: { id: user.id, nome: user.nome, email: user.email } });
    },

    // Logout: destrói a sessão do usuário
    logout(req, res) {
        req.session.destroy(() => {
            res.json({ message: 'Logout realizado' });
        });
    },

    // Retorna os dados do usuário atualmente logado
    me(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        res.json({ id: req.session.userId, nome: req.session.userName });
    },

    listUsers(req, res) {
        res.json(userRepository.listUsers());
    }

};

export default authController;
