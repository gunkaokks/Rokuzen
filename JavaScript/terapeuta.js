// URL da API
const API_URL = 'http://localhost:3000';

// Estado da aplicação
const estado = {
    agendamentoSelecionado: null,
    timerSessao: null,
    timerPausa: null,
    tempoRestanteSessao: 0,
    tempoRestantePausa: 600,
    sessaoEmAndamento: false,
    pausaEmAndamento: false,
    terapeutaId: null
};

// DOM
let elementos = {};

document.addEventListener('DOMContentLoaded', function () {
    console.log('=== INICIANDO PAINEL TERAPEUTA ===');
    
    const loggedIn = localStorage.getItem("loggedIn");
    const token = localStorage.getItem("token");
    const usuarioRaw = localStorage.getItem("usuario");

    // Verificando login do terapeuta
    if (!loggedIn || loggedIn !== "true" || !token || !usuarioRaw) {
        window.location.href = '../Login/login-funcionario.html';
        return;
    }

    try {
        const usuario = JSON.parse(usuarioRaw);
        let tipoUsuario;

        if (typeof usuario.tipo === 'string') {
            const mapeamentoTipo = {
                'master': 1,
                'gerente': 2,
                'recepcao': 3,
                'terapeuta': 4,
                'usuario': 5
            };
            tipoUsuario = mapeamentoTipo[usuario.tipo];
            
        } else {
            tipoUsuario = usuario.tipo;
        }
        
        if (tipoUsuario !== 4) {
            window.location.href = '../Login/login-funcionario.html';
            return;
        }

        if (!usuario.id && !usuario._id) {
            window.location.href = '../Login/login-funcionario.html';
            return;
        }

        estado.terapeutaId = usuario.id || usuario._id;
        
        inicializarElementos();
        carregarAgendamentos();
        configurarEventListeners();

    } catch (error) {
        window.location.href = '../Login/login-funcionario.html';
    }
});

function inicializarElementos() {
    elementos = {
        loadingAgendamentos: document.getElementById('loadingAgendamentos'),
        listaAgendamentos: document.getElementById('listaAgendamentos'),
        infoVazia: document.getElementById('infoVazia'),
        infoAgendamento: document.getElementById('infoAgendamento'),
        infoCliente: document.getElementById('infoCliente'),
        infoServico: document.getElementById('infoServico'),
        infoHorario: document.getElementById('infoHorario'),
        infoDuracao: document.getElementById('infoDuracao'),
        timerTitulo: document.getElementById('timerTitulo'),
        timerDisplay: document.getElementById('timerDisplay'),
        timerPausa: document.getElementById('timerPausa'),
        btnIniciar: document.getElementById('btnIniciar'),
        btnFinalizar: document.getElementById('btnFinalizar'),
        btnPausa: document.getElementById('btnPausa')
    };
}

function configurarEventListeners() {
    elementos.btnIniciar.addEventListener('click', iniciarSessao);
    elementos.btnFinalizar.addEventListener('click', finalizarSessao);
}

// Carregar agendamentos do terapeuta
async function carregarAgendamentos() {
    try {
        const token = localStorage.getItem("token");
        const hoje = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_URL}/agendamentos/terapeuta/${estado.terapeutaId}?data=${hoje}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        const agendamentos = await response.json();
        const agendamentosFormatados = agendamentos.map(agendamento => ({
            _id: agendamento._id,
            cliente_nome: agendamento.usuario_id?.nome || 'Cliente',
            servico_nome: agendamento.servico_id?.nome_servico || 'Serviço',
            inicio_sessao: agendamento.inicio_sessao,
            fim_sessao: agendamento.fim_sessao,
            duracao: agendamento.duracao || calcularDuracao(agendamento.inicio_sessao, agendamento.fim_sessao),
            status: agendamento.status
        }));

        exibirAgendamentos(agendamentosFormatados);

    } catch (error) {
        elementos.listaAgendamentos.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Erro ao carregar agendamentos: ${error.message}
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="carregarAgendamentos()">
                    Tentar Novamente
                </button>
            </div>
        `;
    } finally {
        elementos.loadingAgendamentos.style.display = 'none';
        elementos.listaAgendamentos.style.display = 'block';
    }
}

function exibirAgendamentos(agendamentos) {
    if (agendamentos.length === 0) {
        elementos.listaAgendamentos.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-times fa-3x mb-3"></i>
                <p>Nenhum agendamento para hoje</p>
                <small>Os agendamentos aparecerão aqui quando forem marcados</small>
            </div>
        `;
        return;
    }

    elementos.listaAgendamentos.innerHTML = agendamentos.map(agendamento => `
        <div class="agendamento-card" data-agendamento-id="${agendamento._id}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="mb-1">${agendamento.cliente_nome || 'Cliente'}</h5>
                <span class="status-badge status-agendado">Agendado</span>
            </div>
            <p class="mb-1"><strong>Serviço:</strong> ${agendamento.servico_nome}</p>
            <p class="mb-1"><strong>Horário:</strong> ${formatarHorario(agendamento.inicio_sessao)}</p>
            <p class="mb-0"><strong>Duração:</strong> ${agendamento.duracao || calcularDuracao(agendamento.inicio_sessao, agendamento.fim_sessao)} min</p>
        </div>
    `).join('');

    document.querySelectorAll('.agendamento-card').forEach(card => {
        card.addEventListener('click', function() {
            selecionarAgendamento(this, agendamentos);
        });
    });
}

function selecionarAgendamento(card, agendamentos) {

    document.querySelectorAll('.agendamento-card').forEach(c => {
        c.classList.remove('selecionado');
    });

    card.classList.add('selecionado');

    // Encontrar agendamento selecionado
    const agendamentoId = card.getAttribute('data-agendamento-id');
    estado.agendamentoSelecionado = agendamentos.find(a => a._id === agendamentoId);
    atualizarInformacoesAgendamento();

    // Habilita o botão de iniciar
    elementos.btnIniciar.disabled = false;
}

function atualizarInformacoesAgendamento() {
    const agendamento = estado.agendamentoSelecionado;
    
    elementos.infoCliente.textContent = agendamento.cliente_nome || 'Cliente';
    elementos.infoServico.textContent = agendamento.servico_nome;
    elementos.infoHorario.textContent = formatarHorario(agendamento.inicio_sessao);
    elementos.infoDuracao.textContent = `${agendamento.duracao || calcularDuracao(agendamento.inicio_sessao, agendamento.fim_sessao)} minutos`;

    elementos.infoVazia.style.display = 'none';
    elementos.infoAgendamento.style.display = 'block';

    // Configurar timer da sessão
    estado.tempoRestanteSessao = (agendamento.duracao || calcularDuracao(agendamento.inicio_sessao, agendamento.fim_sessao)) * 60;
    atualizarTimerDisplay();
}

// Timer da Sessão
function iniciarSessao() {
    if (!estado.agendamentoSelecionado || estado.sessaoEmAndamento) return;

    estado.sessaoEmAndamento = true;
    elementos.btnIniciar.disabled = true;
    elementos.btnFinalizar.disabled = false;
    elementos.timerTitulo.textContent = 'Sessão em Andamento';

    estado.timerSessao = setInterval(() => {
        estado.tempoRestanteSessao--;
        atualizarTimerDisplay();

        if (estado.tempoRestanteSessao <= 0) {
            finalizarSessao();
        }
    }, 1000);
}

function finalizarSessao() {
    if (estado.timerSessao) {
        clearInterval(estado.timerSessao);
        estado.timerSessao = null;
    }

    estado.sessaoEmAndamento = false;
    elementos.btnFinalizar.disabled = true;
    elementos.timerTitulo.textContent = 'Sessão Finalizada';

    iniciarPausa();
    agendamentoFinalizado();
}

// Timer da pausa de 10 minutos
function iniciarPausa() {
    estado.pausaEmAndamento = true;
    elementos.btnPausa.style.display = 'block';
    estado.tempoRestantePausa = 600;

    estado.timerPausa = setInterval(() => {
        estado.tempoRestantePausa--;
        atualizarTimerPausa();

        if (estado.tempoRestantePausa <= 0) {
            finalizarPausa();
        }
    }, 1000);
}

function finalizarPausa() {
    if (estado.timerPausa) {
        clearInterval(estado.timerPausa);
        estado.timerPausa = null;
    }

    estado.pausaEmAndamento = false;
    elementos.btnPausa.style.display = 'none';
    elementos.timerTitulo.textContent = 'Pronto para Nova Sessão';
    elementos.timerDisplay.textContent = '00:00';
    estado.agendamentoSelecionado = null;
    elementos.infoAgendamento.style.display = 'none';
    elementos.infoVazia.style.display = 'block';
    carregarAgendamentos();
}

// Funções
function atualizarTimerDisplay() {
    const minutos = Math.floor(estado.tempoRestanteSessao / 60);
    const segundos = estado.tempoRestanteSessao % 60;
    elementos.timerDisplay.textContent = 
        `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

function atualizarTimerPausa() {
    const minutos = Math.floor(estado.tempoRestantePausa / 60);
    const segundos = estado.tempoRestantePausa % 60;
    elementos.timerPausa.textContent = 
        `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

function formatarHorario(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function calcularDuracao(inicio, fim) {
    const inicioDate = new Date(inicio);
    const fimDate = new Date(fim);
    return Math.round((fimDate - inicioDate) / (1000 * 60));
}

async function agendamentoFinalizado() {
    try {
        const token = localStorage.getItem("token");
        
        const response = await fetch(`${API_URL}/agendamentos/${estado.agendamentoSelecionado._id}/finalizar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'finalizado',
                finalizado_em: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao finalizar agendamento');
        }

        console.log('Agendamento finalizado com sucesso');

    } catch (error) {
        console.error('Erro ao finalizar agendamento:', error);
    }
}

function sair() {
    localStorage.clear();
    window.location.href = '../Login/login-funcionario.html';
}