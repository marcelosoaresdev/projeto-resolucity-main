// ================================================
// VALIDAÇÕES
// ================================================

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateName(name) {
    return name.trim().length >= 3;
}

// ================================================
// EXIBIÇÃO DE ERROS INLINE (abaixo dos campos)
// ================================================

function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}-error`);

    input.classList.add('input-error');
    errorSpan.textContent = message;
    errorSpan.classList.add('show'); // necessário para o CSS exibir o texto
}

function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}-error`);

    input.classList.remove('input-error');
    errorSpan.textContent = '';
    errorSpan.classList.remove('show');
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    form.querySelectorAll('.input-error').forEach(input => input.classList.remove('input-error'));
    form.querySelectorAll('.error').forEach(span => {
        span.textContent = '';
        span.classList.remove('show');
    });
}

// ================================================
// FORMULÁRIO DE LOGIN
// ================================================

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors('loginForm');

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-password').value;

    // 1. Valida os campos antes de enviar
    let hasError = false;

    if (!email) {
        showError('login-email', 'Por favor, insira seu e-mail');
        hasError = true;
    } else if (!validateEmail(email)) {
        showError('login-email', 'E-mail inválido');
        hasError = true;
    }

    if (!senha) {
        showError('login-password', 'Por favor, insira sua senha');
        hasError = true;
    }

    if (hasError) return;

    // 2. Envia para o backend
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        // 3a. Credenciais erradas: mostra erro abaixo do campo de senha
        if (!response.ok) {
            showError('login-password', data.message);
            return;
        }

        // 3b. Login ok: redireciona para meus relatos
        window.location.href = '/meus-relatos';

    } catch (err) {
        showError('login-password', 'Erro de conexão com o servidor');
    }
});

// ================================================
// FORMULÁRIO DE CADASTRO
// ================================================

document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors('registerForm');

    const nome  = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const senha = document.getElementById('register-password').value;

    // 1. Valida os campos antes de enviar
    let hasError = false;

    if (!nome) {
        showError('register-name', 'Por favor, insira seu nome completo');
        hasError = true;
    } else if (!validateName(nome)) {
        showError('register-name', 'Nome deve ter pelo menos 3 caracteres');
        hasError = true;
    }

    if (!email) {
        showError('register-email', 'Por favor, insira seu e-mail');
        hasError = true;
    } else if (!validateEmail(email)) {
        showError('register-email', 'E-mail inválido');
        hasError = true;
    }

    if (!senha) {
        showError('register-password', 'Por favor, insira uma senha');
        hasError = true;
    } else if (!validatePassword(senha)) {
        showError('register-password', 'Senha deve ter pelo menos 6 caracteres');
        hasError = true;
    }

    if (hasError) return;

    // 2. Envia para o backend
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        // 3a. Erro (ex: email já cadastrado): mostra abaixo do campo de email
        if (!response.ok) {
            showError('register-email', data.message);
            return;
        }

        // 3b. Cadastro ok: avisa o usuário e manda para o login
        showSuccessModal(
            'Cadastro realizado!',
            'Sua conta foi criada com sucesso. Faça login para continuar.',
            () => {
                document.getElementById('registerForm').reset();
                showLogin();
            }
        );

    } catch (err) {
        showError('register-email', 'Erro de conexão com o servidor');
    }
});

// ================================================
// MODAL DE SUCESSO (usado só no cadastro)
// ================================================

function showSuccessModal(title, message, callback) {
    const modal = document.getElementById('success-modal');
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-message').textContent = message;
    modal.style.display = 'flex';

    document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
        if (callback) callback();
    };
}
