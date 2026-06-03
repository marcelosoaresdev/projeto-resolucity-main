class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) {
            console.error('Formulário não encontrado:', formId);
            return;
        }
        
        this.fields = {
            name: {
                element: document.getElementById('name'),
                error: document.getElementById('nameError'),
                validate: (value) => this.validateName(value)
            },
            cpf: {
                element: document.getElementById('cpf'),
                error: document.getElementById('cpfError'),
                validate: (value) => this.validateCPF(value)
            },
            nascimento: {
                element: document.getElementById('nascimento'),
                error: document.getElementById('nascimentoError'),
                validate: (value) => this.validateBirthdate(value)
            },
            phone: {
                element: document.getElementById('phone'),
                error: document.getElementById('phoneError'),
                validate: (value) => this.validatePhone(value)
            },
            email: {
                element: document.getElementById('email'),
                error: document.getElementById('emailError'),
                validate: (value) => this.validateEmail(value)
            },
            categoria: {
                element: document.getElementById('categoria'),
                error: document.getElementById('categoriaError'),
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
        
        // Adicionar máscaras aos campos
        this.applyMasks();
        
        // Adicionar eventos de validação em tempo real
        this.addRealTimeValidation();
        
        // Prevenir envio padrão do formulário
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    applyMasks() {
        // Máscara para CPF
        if (this.fields.cpf.element) {
            this.fields.cpf.element.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 11) {
                    value = value.slice(0, 11);
                }
                
                if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
                    value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
                }
                
                e.target.value = value;
            });
        }

        // Máscara para telefone
        if (this.fields.phone.element) {
            this.fields.phone.element.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 11) {
                    value = value.slice(0, 11);
                }
                
                if (value.length <= 11) {
                    // Formato: (00) 00000-0000
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

    validateName(value) {
        if (!value) return 'Por favor, informe seu nome';
        if (value.length < 3) return 'O nome deve ter pelo menos 3 caracteres';
        if (!/^[a-zA-ZÀ-ÿ\s]{3,}$/.test(value)) return 'O nome deve conter apenas letras e espaços';
        return true;
    }

    validateCPF(value) {
        if (!value) return 'Por favor, informe um CPF';
        
        // Remover formatação
        const cpf = value.replace(/\D/g, '');
        
        // Verificar tamanho
        if (cpf.length !== 11) return 'CPF deve ter 11 dígitos';
        
        // Verificar se todos os dígitos são iguais (CPF inválido)
        if (/^(\d)\1{10}$/.test(cpf)) return 'CPF inválido';
        
        // Validar dígitos verificadores
        let sum = 0;
        let remainder;
        
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
        }
        
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return 'CPF inválido';
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
        }
        
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return 'CPF inválido';
        
        return true;
    }

    validateBirthdate(value) {
        if (!value) return 'Por favor, informe sua data de nascimento';
        
        const birthDate = new Date(value);
        const today = new Date();
        
        // Verificar se a data é válida
        if (isNaN(birthDate.getTime())) return 'Data de nascimento inválida';
        
        // Verificar se a data não é futura
        if (birthDate > today) return 'Data de nascimento não pode ser futura';
        
        // Calcular idade
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Verificar se tem pelo menos 13 anos
        if (age < 18) return 'Você deve ter pelo menos 18 anos';
        
        // Verificar se não é centenário (idade razoável)
        if (age > 120) return 'Data de nascimento inválida';
        
        return true;
    }

    validatePhone(value) {
        if (!value) return 'Por favor, informe um telefone';
        
        const phone = value.replace(/\D/g, '');
        
        // Verificar tamanho
        if (phone.length !== 10 && phone.length !== 11) {
            return 'Telefone inválido. Use o formato (00) 00000-0000';
        }
        
        // Verificar DDD
        const ddd = parseInt(phone.substring(0, 2));
        if (ddd < 11 || ddd > 99) return 'DDD inválido';
        
        // Verificar se é móvel (11 dígitos) e começa com 9
        if (phone.length === 11 && parseInt(phone.substring(2, 3)) !== 9) {
            return 'Número de celular deve começar com 9';
        }
        
        // Verificar se é fixo (10 dígitos) e começa com 2,3,4 ou 5
        if (phone.length === 10) {
            const firstDigit = parseInt(phone.substring(2, 3));
            if (firstDigit < 2 || firstDigit > 5) {
                return 'Número de telefone fixo inválido';
            }
        }
        
        return true;
    }

    validateEmail(value) {
        if (!value) return 'Por favor, informe um e-mail';
        
        // Regex mais rigoroso para validar e-mail
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(value)) {
            return 'E-mail inválido. Use o formato exemplo@dominio.com';
        }
        
        // Verificar se o domínio é válido
        const parts = value.split('@');
        const domain = parts[1];
        
        if (!domain || domain.length < 3) {
            return 'Domínio de e-mail inválido';
        }
        
        // Verificar se o domínio tem pelo menos um ponto
        if (!domain.includes('.')) {
            return 'Domínio de e-mail deve conter um ponto';
        }
        
        // Verificar se não há caracteres especiais consecutivos
        if (value.includes('..') || value.includes('.@') || value.includes('@.')) {
            return 'E-mail contém caracteres especiais inválidos';
        }
        
        // Verificar comprimento máximo
        if (value.length > 254) {
            return 'E-mail muito longo';
        }
        
        // Verificar se a parte local não excede o limite
        if (parts[0].length > 64) {
            return 'A parte antes do @ é muito longa';
        }
        
        return true;
    }

    validateSelect(value) {
        if (!value) return 'Por favor, selecione uma categoria';
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
            nome:      this.fields.name.element.value.trim(),
            cpf:       this.fields.cpf.element.value.trim(),
            nascimento: this.fields.nascimento.element.value,
            telefone:  this.fields.phone.element.value.trim(),
            email:     this.fields.email.element.value.trim(),
            categoria: this.fields.categoria.element.value,
            endereco:  this.fields.endereco.element.value.trim(),
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
        // Criar elemento de sucesso
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <h3>Relato enviado com sucesso!</h3>
                <p>O seu relato encontra-se em análise, acesse a aba "Relatos" para fazer o acompanhamento.</p>
                <button type="button" id="close-success">OK</button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Adicionar evento para fechar a mensagem
        document.getElementById('close-success').addEventListener('click', () => {
            document.body.removeChild(successDiv);
            this.form.reset();
            
            // Limpar todos os erros ao resetar o formulário
            Object.keys(this.fields).forEach(fieldName => {
                this.clearError(this.fields[fieldName]);
            });
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