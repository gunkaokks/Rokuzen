// Configurações da API
const API_BASE = 'http://localhost:3000';
let token = localStorage.getItem('token');
let agendamentoEditando = null;

// Elementos da interface
const modalEdicaoAgendamento = new bootstrap.Modal(document.getElementById('modalEdicaoAgendamento'));

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    configurarEventos();
    carregarAgendamentos();
});

function verificarAutenticacao() {
    if (!token) {
        window.location.href = '/Login/login-funcionario.html';
        return;
    }
}

function configurarEventos() {
    // Pesquisa
    document.getElementById('pesquisa-agendamentos').addEventListener('input', function() {
        filtrarTabela('corpo-tabela-agendamentos', this.value.toLowerCase());
    });
    
    // Salvar edição
    document.getElementById('salvarEdicaoAgendamento').addEventListener('click', salvarEdicaoAgendamento);
}

async function carregarAgendamentos() {
    try {
        const response = await fetch(`${API_BASE}/agendamentos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar agendamentos');
        
        const agendamentos = await response.json();
        const corpoTabela = document.getElementById('corpo-tabela-agendamentos');
        corpoTabela.innerHTML = '';
        
        agendamentos.forEach(agendamento => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${agendamento.usuario_id?.nome || 'N/A'}</td>
                <td>${agendamento.servico_id?.nome_servico || 'N/A'}</td>
                <td>${formatarData(agendamento.inicio_sessao)}</td>
                <td>${formatarHora(agendamento.inicio_sessao)}</td>
                <td>${agendamento.terapeuta_id?.nome_colaborador || 'N/A'}</td>
                <td>${agendamento.unidade_id?.nome_unidade || 'N/A'}</td>
                <td><span class="badge ${getStatusBadge(agendamento.status)}">${agendamento.status}</span></td>
                <td>${formatarDataHora(agendamento.createdAt)}</td>
                <td>
                    <button class="btn btn-gerente-card-roxo btn-sm" onclick="editarAgendamento('${agendamento._id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            corpoTabela.appendChild(linha);
        });
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar agendamentos');
    }
}

async function editarAgendamento(id) {
    try {
        const response = await fetch(`${API_BASE}/agendamentos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar agendamento');
        
        const agendamentos = await response.json();
        const agendamento = agendamentos.find(a => a._id === id);
        
        if (!agendamento) {
            mostrarErro('Agendamento não encontrado');
            return;
        }
        
        agendamentoEditando = agendamento;
        
        document.getElementById('modalEdicaoAgendamentoLabel').textContent = 'Editar Agendamento';
        
        const corpoModal = document.getElementById('modalEdicaoAgendamentoCorpo');
        corpoModal.innerHTML = `
            <form id="form-edicao-agendamento">
                <div class="mb-3">
                    <label class="form-label">Cliente</label>
                    <input type="text" class="form-control" value="${agendamento.usuario_id?.nome || ''}" readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Serviço</label>
                    <input type="text" class="form-control" value="${agendamento.servico_id?.nome_servico || ''}" readonly>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="data" class="form-label">Data</label>
                        <input type="date" class="form-control" id="data" value="${formatarDataInput(agendamento.inicio_sessao)}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="horario" class="form-label">Horário</label>
                        <input type="time" class="form-control" id="horario" value="${formatarHoraInput(agendamento.inicio_sessao)}" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Terapeuta</label>
                    <input type="text" class="form-control" value="${agendamento.terapeuta_id?.nome_colaborador || ''}" readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Unidade</label>
                    <input type="text" class="form-control" value="${agendamento.unidade_id?.nome_unidade || ''}" readonly>
                </div>
                <div class="mb-3">
                    <label for="status" class="form-label">Status</label>
                    <select class="form-select" id="status" required>
                        <option value="agendado" ${agendamento.status === 'agendado' ? 'selected' : ''}>Agendado</option>
                        <option value="confirmado" ${agendamento.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                        <option value="cancelado" ${agendamento.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        <option value="finalizado" ${agendamento.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                    </select>
                </div>
            </form>
        `;
        
        modalEdicaoAgendamento.show();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar dados do agendamento');
    }
}

async function salvarEdicaoAgendamento() {
    if (!agendamentoEditando) return;
    
    try {
        const dados = {
            status: document.getElementById('status').value
        };
        
        const response = await fetch(`${API_BASE}/agendamentos/${agendamentoEditando._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) throw new Error('Erro ao salvar alterações');
        
        carregarAgendamentos();
        modalEdicaoAgendamento.hide();
        mostrarSucesso('Alterações salvas com sucesso!');
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao salvar alterações');
    }
}

// Funções auxiliares
function filtrarTabela(idCorpoTabela, termo) {
    const linhas = document.querySelectorAll(`#${idCorpoTabela} tr`);
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? '' : 'none';
    });
}

function formatarData(dataString) {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleDateString('pt-BR');
}

function formatarHora(dataString) {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatarDataHora(dataString) {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleString('pt-BR');
}

function formatarDataInput(dataString) {
    if (!dataString) return '';
    return new Date(dataString).toISOString().split('T')[0];
}

function formatarHoraInput(dataString) {
    if (!dataString) return '';
    return new Date(dataString).toTimeString().split(' ')[0].substring(0, 5);
}

function getStatusBadge(status) {
    switch(status) {
        case 'agendado': return 'gerente-card';
        case 'confirmado': return 'bg-success';
        case 'cancelado': return 'bg-danger';
        case 'finalizado': return 'bg-secondary';
        default: return 'light';
    }
}

function mostrarErro(mensagem) {
    alert('Erro: ' + mensagem);
}

function mostrarSucesso(mensagem) {
    alert('Sucesso: ' + mensagem);
}