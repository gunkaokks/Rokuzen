// Configurações da API
const API_BASE = 'http://localhost:3000';

// DOM
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
});

function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/Login/login-funcionario.html';
        return;
    }

    fetch(`${API_BASE}/debug-auth`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            fazerLogout();
        }
        return response.json();
    })
    .catch(error => {
        console.error('Erro na autenticação:', error);
        fazerLogout();
    });
}

function fazerLogout() {
    localStorage.removeItem('token');
    window.location.href = '/Login/login-funcionario.html';
}