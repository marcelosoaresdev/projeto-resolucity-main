import fs from 'fs';

const DB_PATH = './src/database/reports.json';

const reportRepository = {
    createReport: (userId, categoria, tipo, endereco, descricao) => {
        const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const timestamp = new Date().toISOString();
        const newReport = {
            id: reports.length + 1,
            userId,
            categoria,
            tipo,
            endereco,
            descricao,
            status: 'pendente',
            protocolo: `RC-${reports.length + 1}-${Date.now()}`,
            criadoEm: timestamp
        };
        reports.push(newReport);
        fs.writeFileSync(DB_PATH, JSON.stringify(reports, null, 2));
        return { newReport, message: 'Relato criado com sucesso!' };
    },

    listReports: () => {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    },

    listByUserId: (userId) => {
        const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return reports.filter(r => r.userId === userId);
    },

    getStats: () => {
        const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

        // Totais
        const total = reports.length;
        const resolvidos = reports.filter(r => r.status === 'resolvido').length;
        const pendentes = reports.filter(r => r.status === 'pendente').length;
        const emAndamento = reports.filter(r => r.status === 'em_andamento').length;

        // Por categoria
        const porCategoria = {};
        reports.forEach(r => {
            porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + 1;
        });

        // Resolvidos por categoria
        const resolvidosPorCategoria = {};
        reports.filter(r => r.status === 'resolvido').forEach(r => {
            resolvidosPorCategoria[r.categoria] = (resolvidosPorCategoria[r.categoria] || 0) + 1;
        });

        return {
            total,
            resolvidos,
            pendentes,
            emAndamento,
            porCategoria,
            resolvidosPorCategoria
        };
    }
};

export default reportRepository;
