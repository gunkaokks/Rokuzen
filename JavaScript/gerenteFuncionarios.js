// Configurações da API
const API_BASE = 'http://localhost:3000';
let token = localStorage.getItem('token');
let funcionarioEditando = null;

// Elementos da interface
const modalEdicaoFuncionario = new bootstrap.Modal(document.getElementById('modalEdicaoFuncionario'));

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    configurarEventos();
    carregarFuncionarios();
});

function verificarAutenticacao() {
    if (!token) {
        window.location.href = '/Login/login-funcionario.html';
        return;
    }
}

function configurarEventos() {
    // Pesquisa
    document.getElementById('pesquisa-funcionarios').addEventListener('input', function() {
        filtrarTabela('corpo-tabela-funcionarios', this.value.toLowerCase());
    });
    
    // Salvar edição
    document.getElementById('salvarEdicaoFuncionario').addEventListener('click', salvarEdicaoFuncionario);
}

async function carregarFuncionarios() {
    try {
        const response = await fetch(`${API_BASE}/colaboradores`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar funcionários');
        
        const funcionarios = await response.json();
        const corpoTabela = document.getElementById('corpo-tabela-funcionarios');
        corpoTabela.innerHTML = '';
        
        funcionarios.forEach(funcionario => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${funcionario._id}</td>
                <td>${funcionario.nome || funcionario.nome_colaborador || 'N/A'}</td>
                <td>${funcionario.email || 'N/A'}</td>
                <td>${funcionario.telefone || 'N/A'}</td>
                <td>${funcionario.especialidades?.join(', ') || 'N/A'}</td>
                <td>${funcionario.unidade_id?.nome_unidade || 'N/A'}</td>
                <td>${formatarDataHora(funcionario.createdAt)}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editarFuncionario('${funcionario._id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            corpoTabela.appendChild(linha);
        });
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar funcionários');
    }
}

async function editarFuncionario(id) {
    try {
        const response = await fetch(`${API_BASE}/colaboradores`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar funcionário');
        
        const funcionarios = await response.json();
        const funcionario = funcionarios.find(f => f._id === id);
        
        if (!funcionario) {
            mostrarErro('Funcionário não encontrado');
            return;
        }
        
        funcionarioEditando = funcionario;
        
        document.getElementById('modalEdicaoFuncionarioLabel').textContent = 'Editar Funcionário';
        
        const corpoModal = document.getElementById('modalEdicaoFuncionarioCorpo');
        corpoModal.innerHTML = `
            <form id="form-edicao-funcionario">
                <div class="mb-3">
                    <label for="nome" class="form-label">Nome</label>
                    <input type="text" class="form-control" id="nome" value="${funcionario.nome || funcionario.nome_colaborador || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" value="${funcionario.email || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="telefone" class="form-label">Telefone</label>
                    <input type="tel" class="form-control" id="telefone" value="${funcionario.telefone || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="especialidades" class="form-label">Especialidades</label>
                    <input type="text" class="form-control" id="especialidades" value="${funcionario.especialidades?.join(', ') || ''}" required>
                </div>
            </form>
        `;
        
        modalEdicaoFuncionario.show();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar dados do funcionário');
    }
}

async function salvarEdicaoFuncionario() {
    if (!funcionarioEditando) return;
    
    try {
        const dados = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            especialidades: document.getElementById('especialidades').value.split(',').map(e => e.trim())
        };
        
        const response = await fetch(`${API_BASE}/colaboradores/${funcionarioEditando._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) throw new Error('Erro ao salvar alterações');
        
        carregarFuncionarios();
        modalEdicaoFuncionario.hide();
        mostrarSucesso('Alterações salvas com sucesso!');
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao salvar alterações');
    }
}

// Funções auxiliares (reutilizadas dos arquivos anteriores)
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