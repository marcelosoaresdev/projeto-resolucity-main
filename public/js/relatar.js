const TIPOS_POR_CATEGORIA = {
  'Acessibilidade': ['Rampa bloqueada', 'Piso irregular', 'Sem elevador'],
  'Ciclismo': ['Ciclofaixa danificada', 'Ausência de ciclofaixa'],
  'Comércio e Fiscalização': ['Calçada irregular', 'Propaganda irregular'],
  'Corrupção e Má Gestão': ['Denúncia anônima'],
  'Drenagem': ['Boca de lobo entupida', 'Alagamento'],
  'Educação': ['Escola sem manutenção'],
  'Habitação': ['Área de risco', 'Construção irregular'],
  'Infraestrutura': ['Buraco', 'Iluminação queimada', 'Calçada quebrada', 'Lombada', 'Placa indisível'],
  'Limpeza Urbana e Lixo': ['Lixo acumulado', 'Área contaminada'],
  'Meio Ambiente': ['Desmatamento', 'Poluição', 'Maus-tratos'],
  'Obras': ['Obra abandonada', 'Má sinalização'],
  'Redes Elétricas/Luz': ['Fiação exposta', 'Postes danificados'],
  'Saúde Pública': ['Acúmulo de insetos', 'Esgoto a céu aberto'],
  'Segurança': ['Furto', 'Vandalismo', 'Drogas'],
  'Transporte': ['Ponto de ônibus danificado', 'Placa de rua ausente'],
  'Outros': ['Outro problema']
};

class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) {
            console.error('Formulário não encontrado:', formId);
            return;
        }

        this.fields = {
            categoria: {
                element: document.getElementById('categoria'),
                error: document.getElementById('categoriaError'),
                validate: (value) => this.validateSelect(value)
            },
            tipo: {
                element: document.getElementById('tipo'),
                error: document.getElementById('tipoError'),
                validate: (value) => this.validateSelect(value)
            },
            endereco: {
                element: document.getElementById('endereco'),
                error: document.getElementById('enderecoError'),
                validate: (value) => this.validateAddress(value)
            },
            message: {
                element: document.getElementById('message'),
                error: document.getElementById('messageError'),
                validate: (value) => this.validateMessage(value)
            },
            foto: {
                element: document.getElementById('foto'),
                error: document.getElementById('fotoError'),
                validate: (value) => this.validatePhoto(value)
            }
        };

        this.init();
    }

    init() {
        // Verificar se todos os elementos existem
        Object.keys(this.fields).forEach(field => {
            if (!this.fields[field].element) {
                console.error('Elemento não encontrado:', field);
            }
            if (this.fields[field].error === null) {
                console.warn('Elemento de erro não definido para:', field);
            }
        });

        // Adicionar eventos de validação em tempo real
        this.addRealTimeValidation();

        // Prevenir envio padrão do formulário
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Categoria change -> populate tipo
        const categoriaSelect = document.getElementById('categoria');
        const tipoSelect = document.getElementById('tipo');
        if (categoriaSelect && tipoSelect) {
            categoriaSelect.addEventListener('change', () => {
                const categoria = categoriaSelect.value;
                tipoSelect.innerHTML = '<option value="">Selecione</option>';
                if (categoria && TIPOS_POR_CATEGORIA[categoria]) {
                    TIPOS_POR_CATEGORIA[categoria].forEach(tipo => {
                        const opt = document.createElement('option');
                        opt.value = tipo;
                        opt.textContent = tipo;
                        tipoSelect.appendChild(opt);
                    });
                }
            });
        }
    }

    addRealTimeValidation() {
        // Validar campos quando o usuário sai deles (evento blur)
        Object.keys(this.fields).forEach(field => {
            if (this.fields[field].element) {
                this.fields[field].element.addEventListener('blur', () => {
                    this.validateField(field);
                });
            }
        });
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        // Para campos de arquivo, usamos o elemento diretamente
        const value = field.element.type === 'file' ? field.element : field.element.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Validar campo
        const validationResult = field.validate(value);

        if (validationResult !== true) {
            isValid = false;
            errorMessage = validationResult;
        }

        // Atualizar interface (apenas se houver elemento de erro)
        if (!isValid) {
            this.showError(field, errorMessage);
        } else {
            this.clearError(field);
        }

        return isValid;
    }

    validateSelect(value) {
        if (!value) return 'Por favor, selecione uma opção';
        return true;
    }

    validateAddress(value) {
        if (!value) return 'Por favor, digite a localização do relato';
        if (value.length < 10) return 'A localização deve ter pelo menos 10 caracteres';
        return true;
    }

    validateMessage(value) {
        if (!value) return 'Por favor, digite a descrição do relato';
        if (value.length < 20) return 'A descrição deve ter pelo menos 20 caracteres';
        return true;
    }

    validatePhoto(fileInput) {
        if (!fileInput.files || !fileInput.files.length) return true; // Opcional

        const file = fileInput.files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            return 'Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)';
        }

        if (file.size > maxSize) {
            return 'A imagem deve ter no máximo 5MB';
        }

        return true;
    }

    showError(field, message) {
        if (field.error) {
            field.error.textContent = message;
            field.error.style.display = 'block';
        }
        field.element.classList.add('error-field');
    }

    clearError(field) {
        if (field.error) {
            field.error.style.display = 'none';
        }
        field.element.classList.remove('error-field');
    }

    validateAll() {
        let isValid = true;
        let firstErrorField = null;

        Object.keys(this.fields).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;

                // Encontrar o primeiro campo com erro
                if (!firstErrorField) {
                    firstErrorField = fieldName;
                }
            }
        });

        // Scroll para o primeiro campo com erro
        if (!isValid && firstErrorField) {
            this.fields[firstErrorField].element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            this.fields[firstErrorField].element.focus();
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateAll()) return;

        const body = {
            categoria: this.fields.categoria.element.value,
            tipo: this.fields.tipo.element.value,
            endereco: this.fields.endereco.element.value.trim(),
            descricao: this.fields.message.element.value.trim()
        };

        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Erro ao enviar relato');

            this.showSuccessMessage();
        } catch (err) {
            alert('Não foi possível enviar o relato. Tente novamente.');
            console.error(err);
        }
    }

    showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <h3>Relato enviado com sucesso!</h3>
                <p>O seu relato encontra-se em análise.</p>
                <div style="display:flex;gap:8px;margin-top:16px">
                    <button id="close-success" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;cursor:pointer">Fechar</button>
                    <a href="/meus-relatos" style="flex:1;padding:10px;border-radius:8px;background:#146C43;color:white;text-align:center;text-decoration:none">Ver meus relatos</a>
                </div>
            </div>
        `;
        document.body.appendChild(successDiv);

        document.getElementById('close-success').addEventListener('click', () => {
            document.body.removeChild(successDiv);
            this.form.reset();
            Object.keys(this.fields).forEach(fieldName => this.clearError(this.fields[fieldName]));
            const tipoSelect = document.getElementById('tipo');
            if (tipoSelect) tipoSelect.innerHTML = '<option value="">Selecione primeiro a categoria</option>';
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new FormValidator('contactForm');

    const cat = new URLSearchParams(window.location.search).get('cat');
    if (cat) {
        const select = document.getElementById('categoria');
        const match = [...select.options].find(o => o.value === cat || o.text === cat);
        if (match) match.selected = true;
    }
});

// Menu mobile toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });
    }
});