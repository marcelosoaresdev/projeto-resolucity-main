// Centro: Volta Redonda, RJ
export const CENTER = [-22.5207, -44.0883];

export const STATUS_CONFIG = {
    pendente:      { color: '#f59e0b', label: 'Pendente' },
    em_andamento:  { color: '#3b82f6', label: 'Em Andamento' },
    resolvido:     { color: '#22c55e', label: 'Resolvido' },
};

// Ícone personalizado por status
export function createIcon(status) {
    const { color } = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
    return L.divIcon({
        html: `<div style="
            background:${color};
            width:32px;height:32px;
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
        ">
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

// Reverse geocoding via Nominatim
export async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=pt-BR`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Resolucity/1.0 (projeto-resolucity@example.com)' }
        });
        if (!res.ok) throw new Error('Nominatim error');
        const data = await res.json();
        return formatAddress(data.address);
    } catch (err) {
        console.warn('Reverse geocoding falhou:', err);
        return null;
    }
}

// Formatar endereço do Nominatim para formato brasileiro
function formatAddress(address) {
    if (!address) return '';
    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.house_number) parts.push(address.house_number);
    if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb);
    if (address.city || address.municipality) parts.push(address.city || address.municipality);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
}

// Formatar data para pt-BR com hora
export function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}