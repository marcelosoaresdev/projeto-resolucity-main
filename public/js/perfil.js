document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profileForm');
    const feedback = document.getElementById('feedback');

    // Load current profile data
    try {
        const res = await fetch('/api/auth/profile');
        if (!res.ok) throw new Error('Erro ao carregar perfil');

        const data = await res.json();

        document.getElementById('nome').value = data.nome || '';
        document.getElementById('cpf').value = data.cpf || '';
        document.getElementById('nascimento').value = data.nascimento || '';
        document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('email').value = data.email || '';
    } catch (err) {
        showFeedback('Não foi possível carregar os dados do perfil.', 'error');
    }

    // Phone mask
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length <= 11) {
                if (value.length <= 2) {
                    value = value.replace(/(\d{0,2})/, '($1');
                } else if (value.length <= 6) {
                    value = value.replace(/(\d{2})(\d{0,4})/, '($1) $2');
                } else if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else {
                    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
            }
            e.target.value = value;
        });
    }

    // CPF mask
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 6) {
                value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
            } else if (value.length <= 9) {
                value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
            } else {
                value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
            }
            e.target.value = value;
        });
    }

    // Form submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const body = {
                nome:        document.getElementById('nome').value.trim(),
                cpf:         document.getElementById('cpf').value.trim(),
                nascimento:  document.getElementById('nascimento').value,
                telefone:    document.getElementById('telefone').value.trim(),
                email:       document.getElementById('email').value.trim()
            };

            // Basic validation
            if (!body.nome || !body.nascimento || !body.telefone || !body.email) {
                showFeedback('Preencha todos os campos obrigatórios.', 'error');
                return;
            }

            try {
                const res = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const result = await res.json();

                if (!res.ok) throw new Error(result.message || 'Erro ao salvar');

                showFeedback('Perfil atualizado com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = '/meus-relatos';
                }, 1500);
            } catch (err) {
                showFeedback(err.message || 'Não foi possível salvar. Tente novamente.', 'error');
            }
        });
    }

    function showFeedback(message, type) {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.className = `mb-6 alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
        feedback.classList.remove('hidden');
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});