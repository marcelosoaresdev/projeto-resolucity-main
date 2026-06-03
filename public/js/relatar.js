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
            tipo: this.fields.tipo ? this.fields.tipo.element.value : '',
            endereco: this.fields.endereco.element.value.trim(),
            descricao: this.fields.message.element.value.trim(),
            latitude: currentLat,
            longitude: currentLng
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
        successDiv.id = 'success-modal';
        successDiv.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px)';
        successDiv.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:400px;width:100%;padding:24px;text-align:center">
                <div style="width:48px;height:48px;background:#d2e8dd;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#146C43" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 style="font-size:18px;font-weight:700;color:#222;margin:0 0 8px">Relato enviado com sucesso!</h3>
                <p style="font-size:14px;color:#666;margin:0 0 20px">O seu relato encontra-se em análise.</p>
                <div style="display:flex;gap:8px">
                    <button id="btn-fechar-sucesso" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;cursor:pointer;font-size:14px">Fechar</button>
                    <a href="/meus-relatos" style="flex:1;padding:10px;border-radius:8px;background:#146C43;color:white;text-align:center;text-decoration:none;font-size:14px">Ver meus relatos</a>
                </div>
            </div>
        `;
        document.body.appendChild(successDiv);

        document.getElementById('btn-fechar-sucesso').addEventListener('click', () => {
            successDiv.remove();
            this.form.reset();
            Object.keys(this.fields).forEach(fieldName => this.clearError(this.fields[fieldName]));
            const tipoSelect = document.getElementById('tipo');
            if (tipoSelect) tipoSelect.innerHTML = '<option value="">Selecione primeiro a categoria</option>';
        });

        successDiv.addEventListener('click', (e) => {
            if (e.target === successDiv) successDiv.remove();
        });
    }
}

// ============================================
// Mapa inline para seleção de localização (RF-002)
// ============================================

const CENTER = [-22.5207, -44.0883];

function createMapIcon(status) {
    return L.divIcon({
        html: `<div style="background:#f59e0b;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
}

async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=pt-BR`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Resolucity/1.0 (projeto-resolucity@example.com)' }
        });
        if (!res.ok) throw new Error('Nominatim error');
        const data = await res.json();
        return formatNominatimAddress(data.address);
    } catch (err) {
        console.warn('Reverse geocoding falhou:', err);
        return null;
    }
}

function formatNominatimAddress(address) {
    if (!address) return '';
    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.house_number) parts.push(address.house_number);
    if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb);
    if (address.city || address.municipality) parts.push(address.city || address.municipality);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
}

let mapInstance = null;
let pinMarker = null;
let currentLat = null;
let currentLng = null;

function initMap() {
    const mapContainer = document.getElementById('map-container');
    const btnShowMap = document.getElementById('btn-show-map');
    const enderecoInput = document.getElementById('endereco');
    const enderecoStatus = document.getElementById('enderecoStatus');

    if (!btnShowMap || !enderecoInput) return;

    btnShowMap.addEventListener('click', async () => {
        mapContainer.style.display = 'block';
        btnShowMap.style.display = 'none';
        enderecoInput.removeAttribute('readonly');
        enderecoInput.placeholder = 'Clique no mapa para selecionar...';
        enderecoInput.value = '';
        enderecoInput.focus();

        if (mapInstance) {
            setTimeout(() => mapInstance.invalidateSize(), 200);
            return;
        }

        mapInstance = L.map('relatar-map').setView(CENTER, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(mapInstance);

        pinMarker = L.marker(CENTER, {
            draggable: true,
            icon: createMapIcon('pendente')
        }).addTo(mapInstance);

        mapInstance.on('click', async (e) => {
            pinMarker.setLatLng(e.latlng);
            currentLat = e.latlng.lat;
            currentLng = e.latlng.lng;
            await fetchAddress();
        });

        pinMarker.on('dragend', async () => {
            const pos = pinMarker.getLatLng();
            currentLat = pos.lat;
            currentLng = pos.lng;
            await fetchAddress();
        });

        setTimeout(() => mapInstance.invalidateSize(), 200);
    });

    async function fetchAddress() {
        if (!currentLat || !currentLng) return;
        enderecoStatus.style.display = 'block';
        const addr = await reverseGeocode(currentLat, currentLng);
        if (addr) {
            enderecoInput.value = addr;
            enderecoStatus.style.display = 'none';
        } else {
            enderecoInput.placeholder = 'Endereço não encontrado. Digite manualmente.';
            enderecoInput.readOnly = false;
            enderecoStatus.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    if (document.getElementById('contactForm')) {
        new FormValidator('contactForm');
    }

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