import reportRepository from '../repositories/reportRepository.js';

const reportController = {
    createReport(req, res) {
        const { categoria, tipo, endereco, descricao } = req.body;
        const userId = req.session.userId;
        const result = reportRepository.createReport(userId, categoria, tipo, endereco, descricao);
        res.status(201).json(result);
    },

    listReports(req, res) {
        const reports = reportRepository.listReports();
        res.json(reports);
    },

    listMyReports(req, res) {
        const reports = reportRepository.listByUserId(req.session.userId);
        res.json(reports);
    },

    getStats(req, res) {
        const stats = reportRepository.getStats();
        res.json(stats);
    }
};

export default reportController;