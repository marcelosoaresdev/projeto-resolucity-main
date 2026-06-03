import reportRepository from '../repositories/reportRepository.js';

const reportController = {
    createReport(req, res) {
        const { nome, cpf, nascimento, telefone, email, categoria, endereco, descricao } = req.body;
        const userId = req.session.userId;
        const result = reportRepository.createReport(userId, nome, cpf, nascimento, telefone, email, categoria, endereco, descricao);
        res.status(201).json(result);
    },

    listReports(req, res) {
        const reports = reportRepository.listReports();
        res.json(reports);
    },

    listMyReports(req, res) {
        const reports = reportRepository.listByUserId(req.session.userId);
        res.json(reports);
    }
};

export default reportController;
