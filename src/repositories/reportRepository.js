import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import userRepository from './userRepository.js';
import reportFactory from '../factories/reportFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../database/reports.json');

const reportRepository = {
    createReport: (userId, categoria, tipo, endereco, descricao, latitude, longitude) => {
        const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const maxId = reports.reduce((max, r) => Math.max(max, r.id || 0), 0);

        //  Factory cria o objeto, repository só persiste
        const newReport = reportFactory.create(categoria, {
            userId,
            tipo,
            endereco,
            descricao,
            latitude,
            longitude,
            categoria,
        }, maxId);

        reports.push(newReport);
        fs.writeFileSync(DB_PATH, JSON.stringify(reports, null, 2));
        return { newReport, message: 'Relato criado com sucesso!' };
    },

    listReports: () => {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    },

    listByUserId: (userId) => {
        const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const userReports = reports.filter(r => r.userId === userId);
        // Anexar dados pessoais do usuário a cada relato
        return userReports.map(r => {
            const user = userRepository.findById(r.userId);
            return {
                ...r,
                nome: user ? user.nome : '',
                cpf: user ? user.cpf : '',
                nascimento: user ? user.nascimento : '',
                telefone: user ? user.telefone : '',
                email: user ? user.email : ''
            };
        });
    },

    updateReport: (id, userId, updates) => {
        const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const index = reports.findIndex(r => r.id === id);

        if (index === -1) {
            return { success: false, message: 'Relato não encontrado.' };
        }

        if (reports[index].userId !== userId) {
            return { success: false, message: 'Você não tem permissão para editar este relato.' };
        }

        reports[index] = {
            ...reports[index],
            ...updates,
            atualizadoEm: new Date().toISOString()
        };

        fs.writeFileSync(DB_PATH, JSON.stringify(reports, null, 2));
        return { success: true, report: reports[index], message: 'Relato atualizado com sucesso!' };
    },

    deleteReport: (id, userId) => {
        const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const index = reports.findIndex(r => r.id === id);

        if (index === -1) {
            return { success: false, message: 'Relato não encontrado.' };
        }

        if (reports[index].userId !== userId) {
            return { success: false, message: 'Você não tem permissão para excluir este relato.' };
        }

        const deleted = reports.splice(index, 1)[0];
        fs.writeFileSync(DB_PATH, JSON.stringify(reports, null, 2));
        return { success: true, message: 'Relato excluído com sucesso!' };
    },

    getStats: (period, startDate, endDate) => {
        let reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

        // Filtro por período
        if (period && period !== 'all') {
            const now = new Date();
            let start;

            if (period === '7d') {
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (period === '30d') {
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            } else if (period === 'ano') {
                start = new Date(now.getFullYear(), 0, 1); // 1 Jan do ano atual
            } else if (period === 'custom' && startDate && endDate) {
                start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                reports = reports.filter(r => {
                    const created = new Date(r.criadoEm);
                    return created >= start && created <= end;
                });
            }

            if (period !== 'custom') {
                start.setHours(0, 0, 0, 0);
                reports = reports.filter(r => new Date(r.criadoEm) >= start);
            }
        }

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

        // Por bairro (extraído do endereço)
        const porBairro = {};
        reports.forEach(r => {
            const bairro = extractBairro(r.endereco);
            porBairro[bairro] = (porBairro[bairro] || 0) + 1;
        });

        // Por mês (últimos 12 meses)
        const porMes = {};
        const resolvidosPorMes = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            porMes[key] = 0;
            resolvidosPorMes[key] = 0;
        }

        reports.forEach(r => {
            const created = new Date(r.criadoEm);
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
            if (porMes[key] !== undefined) {
                porMes[key]++;
            }
            if (r.status === 'resolvido' && resolvidosPorMes[key] !== undefined) {
                resolvidosPorMes[key]++;
            }
        });

        return {
            total,
            resolvidos,
            pendentes,
            emAndamento,
            porCategoria,
            resolvidosPorCategoria,
            porBairro,
            porMes,
            resolvidosPorMes
        };
    }
};

// Função auxiliar para extrair bairro do endereço
function extractBairro(endereco) {
    if (!endereco) return 'Outros';

    // Padrão 1: "Rua X, NUMERO - BAIRRO, Cidade - Estado"
    // Ex: "Rua das Flores, 123 - Centro, Volta Redonda - RJ"
    const match1 = endereco.match(/,\s*([^,]+?)\s*-\s*[^,]+$/);
    if (match1 && match1[1]) {
        const bairro = match1[1].trim();
        if (bairro.length < 30 && !bairro.match(/\d{5,}/)) {
            return bairro;
        }
    }

    // Padrão 2: "Rua X, NUMERO, BAIRRO, Cidade, Estado"
    // Ex: "Rua 23 A, Vila Santa Cecília, Volta Redonda, Rio de Janeiro"
    // Extrair o penúltimo segmento (antes da cidade)
    const parts = endereco.split(',').map(p => p.trim());
    if (parts.length >= 3) {
        // parts[0] = "Rua 23 A" (rua + numero)
        // parts[1] = "Vila Santa Cecília" (BAIRRO)
        // parts[2] = "Volta Redonda" (cidade)
        // parts[3] = "Rio de Janeiro" (estado)
        // Pegamos parts[1] que é o bairro
        const bairro = parts[1];
        if (bairro && bairro.length < 30 && !bairro.match(/\d{5,}/)) {
            return bairro;
        }
    }

    return 'Outros';
}

export default reportRepository;
