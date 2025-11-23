// Configurações da API
const API_BASE = 'http://localhost:3000';
let token = localStorage.getItem('token');
let usuarioEditando = null;

// Elementos da interface
const modalEdicaoUsuario = new bootstrap.Modal(document.getElementById('modalEdicaoUsuario'));

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    configurarEventos();
    carregarUsuarios();
});

function verificarAutenticacao() {
    if (!token) {
        window.location.href = '/Login/login-funcionario.html';
        return;
    }
}

function configurarEventos() {
    // Pesquisa
    document.getElementById('pesquisa-usuarios').addEventListener('input', function() {
        filtrarTabela('corpo-tabela-usuarios', this.value.toLowerCase());
    });
    
    // Salvar edição
    document.getElementById('salvarEdicaoUsuario').addEventListener('click', salvarEdicaoUsuario);
}

async function carregarUsuarios() {
    try {
        const response = await fetch(`${API_BASE}/usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar usuários');
        
        const usuarios = await response.json();
        const corpoTabela = document.getElementById('corpo-tabela-usuarios');
        corpoTabela.innerHTML = '';
        
        usuarios.forEach(usuario => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${usuario.nome || 'N/A'}</td>
                <td>${usuario.email || 'N/A'}</td>
                <td>${usuario.telefone || 'N/A'}</td>
                <td>${usuario.tipo || 'Cliente'}</td>
                <td>${formatarDataHora(usuario.createdAt)}</td>
                <td>
                    <button class="btn btn-gerente-card-roxo btn-sm" onclick="editarUsuario('${usuario._id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            corpoTabela.appendChild(linha);
        });
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar usuários');
    }
}

async function editarUsuario(id) {
    try {
        const response = await fetch(`${API_BASE}/usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar usuário');
        
        const usuarios = await response.json();
        const usuario = usuarios.find(u => u._id === id);
        
        if (!usuario) {
            mostrarErro('Usuário não encontrado');
            return;
        }
        
        usuarioEditando = usuario;
        
        document.getElementById('modalEdicaoUsuarioLabel').textContent = 'Editar Usuário';
        
        const corpoModal = document.getElementById('modalEdicaoUsuarioCorpo');
        corpoModal.innerHTML = `
            <form id="form-edicao-usuario">
                <div class="mb-3">
                    <label for="nome" class="form-label">Nome</label>
                    <input type="text" class="form-control" id="nome" value="${usuario.nome || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" value="${usuario.email || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="telefone" class="form-label">Telefone</label>
                    <input type="tel" class="form-control" id="telefone" value="${usuario.telefone || ''}" required>
                </div>
            </form>
        `;
        
        modalEdicaoUsuario.show();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar dados do usuário');
    }
}

async function salvarEdicaoUsuario() {
    if (!usuarioEditando) return;
    
    try {
        const dados = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value
        };
        
        const response = await fetch(`${API_BASE}/clientes/${usuarioEditando._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) throw new Error('Erro ao salvar alterações');
        
        carregarUsuarios();
        modalEdicaoUsuario.hide();
        mostrarSucesso('Alterações salvas com sucesso!');
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao salvar alterações');
    }
}

// Funções auxiliares (reutilizadas do arquivo anterior)
function filtrarTabela(idCorpoTabela, termo) {
    const linhas = document.querySelectorAll(`#${idCorpoTabela} tr`);
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? '' : 'none';
    });
}

function formatarDataHora(dataString) {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleString('pt-BR');
}

function mostrarErro(mensagem) {
    alert('Erro: ' + mensagem);
}

function mostrarSucesso(mensagem) {
    alert('Sucesso: ' + mensagem);
}