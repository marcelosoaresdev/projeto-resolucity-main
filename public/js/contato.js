class ContactFormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {
            name: {
                element: document.getElementById('name'),
                error: document.getElementById('nameError'),
                validate: (value) => this.validateName(value)
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
            message: {
                element: document.getElementById('message'),
                error: document.getElementById('messageError'),
                validate: (value) => this.validateMessage(value)
            }
        };

        this.init();
    }

    init() {
        // Adicionar máscaras aos campos
        this.applyMasks();
        
        // Adicionar eventos de validação em tempo real
        this.addRealTimeValidation();
        
        // Prevenir envio padrão do formulário
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    applyMasks() {
        // Máscara para telefone
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

    addRealTimeValidation() {
        // Validar campos quando o usuário sai deles (evento blur)
        Object.keys(this.fields).forEach(field => {
            if (this.fields[field].element) {
                this.fields[field].element.addEventListener('blur', () => {
                    this.validateField(field);
                });
                
                // Também validar durante a digitação para feedback mais imediato
                this.fields[field].element.addEventListener('input', () => {
                    this.validateField(field);
                });
            }
        });
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        const value = field.element.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Validar campo
        const validationResult = field.validate(value);
        
        if (validationResult !== true) {
            isValid = false;
            errorMessage = validationResult;
        }

        // Atualizar interface
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

    validateMessage(value) {
        if (!value) return 'Por favor, digite sua mensagem';
        if (value.length < 10) return 'A mensagem deve ter pelo menos 10 caracteres';
        if (value.length > 1000) return 'A mensagem não pode exceder 1000 caracteres';
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

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.validateAll()) {
            // Simular envio (substituir por código real de envio)
            this.showSuccessMessage();
            
            // Aqui faria o envio real do formulário
            // this.form.submit();
        }
    }

    showSuccessMessage() {
        // Criar elemento de sucesso
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <h3>Mensagem enviada com sucesso!</h3>
                <p>Entraremos em contato em breve. Obrigado!</p>
                <button type="button" id="close-success">OK</button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Adicionar evento para fechar a mensagem
        document.getElementById('close-success').addEventListener('click', () => {
            document.body.removeChild(successDiv);
            this.form.reset();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ContactFormValidator('contactForm');
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