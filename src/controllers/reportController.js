import reportRepository from '../repositories/reportRepository.js';

const reportController = {
    createReport(req, res) {
        const { categoria, tipo, endereco, descricao, latitude, longitude } = req.body;
        const userId = req.session.userId;

        // O controller não sabe como o relatório é construído — responsabilidade da Factory
        const result = reportRepository.createReport(
            userId, categoria, tipo, endereco, descricao, latitude, longitude
        );

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
        const { period, start, end } = req.query;
        const stats = reportRepository.getStats(period, start, end);
        res.json(stats);
    },

    updateReport(req, res) {
        const { id } = req.params;
        const userId = req.session.userId;
        const { categoria, tipo, endereco, descricao, latitude, longitude, status } = req.body;

        const result = reportRepository.updateReport(
            parseInt(id),
            userId,
            { categoria, tipo, endereco, descricao, latitude, longitude, status }
        );

        if (!result.success) {
            return res.status(403).json({ message: result.message });
        }

        res.json(result);
    },

    deleteReport(req, res) {
        const { id } = req.params;
        const userId = req.session.userId;

        const result = reportRepository.deleteReport(parseInt(id), userId);

        if (!result.success) {
            return res.status(403).json({ message: result.message });
        }

        res.json(result);
    }
};

export default reportController;