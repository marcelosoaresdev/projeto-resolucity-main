const reportFactory = {
    create(categoria, dados, maxId) {
        const config = {
            categoria: categoria,
            statusInicial: 'pendente',
        };

        return {
            id: maxId + 1,
            userId: dados.userId,
            categoria: config.categoria,
            tipo: dados.tipo ?? null,
            endereco: dados.endereco,
            descricao: dados.descricao,
            status: config.statusInicial,
            protocolo: `RC-${maxId + 1}-${Date.now()}`,
            criadoEm: new Date().toISOString(),
            latitude: dados.latitude ?? null,
            longitude: dados.longitude ?? null,
        };
    }
};

export default reportFactory;