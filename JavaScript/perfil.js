// URL da API
const API_URL = 'http://localhost:3000';

async function descobrirRotasDaAPI() {
    try {
        const token = localStorage.getItem('token');
        const rotasParaTestar = [
            '/meu-perfil',
            '/perfil',
            '/usuario',
            '/user',
            '/users/me',
            '/auth/me'
        ];

        for (const rota of rotasParaTestar) {
            try {
                const response = await fetch(`${API_URL}${rota}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(`Rota ${rota}: Status ${response.status}`);
            } catch (error) {
                console.log(`Rota ${rota}: Erro - ${error.message}`);
            }
        }
    } catch (error) {
        console.error('Erro ao explorar rotas:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('perfil.js carregado - DOM pronto');

    // Verificação de login
    const loggedIn = localStorage.getItem("loggedIn");
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (!loggedIn || loggedIn !== "true" || !token || !usuario) {
        window.location.href = '../Login/login.html';
        return;
    }

    console.log(' Usuário logado:', JSON.parse(usuario));

    // Inicializar
    carregarInformacoesUsuario();
    configurarEventos();
});

function carregarInformacoesUsuario() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const token = localStorage.getItem('token');

    // Atualizar interface
    document.getElementById('userName').textContent = usuario.nome || 'Não informado';
    document.getElementById('userEmail').textContent = usuario.email || 'Não informado';
    document.getElementById('userPhone').textContent = usuario.telefone || 'Não informado';

    if (usuario.data_criacao) {
        const data = new Date(usuario.data_criacao);
        document.getElementById('userSince').textContent = data.toLocaleDateString('pt-BR');
    } else {
        document.getElementById('userSince').textContent = 'Data não disponível';
    }

    // Preencher formulário de edição
    document.getElementById('editName').value = usuario.nome || '';
    document.getElementById('editEmail').value = usuario.email || '';
    document.getElementById('editPhone').value = usuario.telefone || '';

    // Carregar agendamentos
    carregarAgendamentos(token);
}

function carregarAgendamentos(token) {
    const appointmentsContainer = document.getElementById('userAppointments');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    fetch(`${API_URL}/agendamentos`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.status === 401) {
                fazerLogout();
                throw new Error('Token inválido');
                window.location.href = '../Login/login.html';
            }
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(agendamentos => {
            if (!agendamentos || !Array.isArray(agendamentos)) {
                throw new Error('Resposta inválida da API');
            }

            const usuarioId = JSON.parse(localStorage.getItem('usuario'))._id;

            const meusAgendamentos = agendamentos.filter(ag =>
                ag.usuario_id && ag.usuario_id._id === usuarioId
            );

            if (meusAgendamentos.length > 0) {
                let html = '';
                meusAgendamentos.forEach(agendamento => {

                    const dataAgendamento = agendamento.inicio_sessao ?
                        new Date(agendamento.inicio_sessao).toLocaleString('pt-BR') :
                        'Não definida';

                    html += `
                    <div class="appointment-item mb-3 p-3 border rounded">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Serviço:</strong> ${agendamento.servico_id?.nome_servico || 'Massagem'}
                            </div>
                            <div class="col-md-6">
                                <strong>Data:</strong> ${dataAgendamento}
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <strong>Unidade:</strong> ${agendamento.unidade_id?.nome_unidade || 'Não definida'}
                            </div>
                            <div class="col-md-6">
                                <strong>Status:</strong> 
                                <span class="badge bg-${getBadgeColor(agendamento.status)}">
                                    ${agendamento.status || 'agendado'}
                                </span>
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <strong>Terapeuta:</strong> ${agendamento.terapeuta_id?.nome_colaborador || 'Não definido'}
                            </div>
                            <div class="col-md-6">
                                <strong>Valor:</strong> R$ ${agendamento.valor?.toFixed(2) || '0,00'}
                            </div>
                        </div>
                        ${agendamento.observacoes ? `
                        <div class="row mt-2">
                            <div class="col-12">
                                <strong>Observações:</strong> ${agendamento.observacoes}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
                });
                appointmentsContainer.innerHTML = html;
            } else {
                appointmentsContainer.innerHTML = '<p class="text-muted">Nenhum agendamento encontrado.</p>';
            }
        })
        .catch(error => {
            appointmentsContainer.innerHTML = `
            <p class="text-muted">Erro ao carregar agendamentos: ${error.message}</p>
            <button class="btn btn-sm btn-primary mt-2" onclick="carregarAgendamentos(localStorage.getItem('token'))">
                Tentar Novamente
            </button>
        `;
        });
}

function getBadgeColor(status) {
    switch (status?.toLowerCase()) {
        case 'agendado':
            return 'primary';
        case 'confirmado':
        case 'concluído':
            return 'success';
        case 'cancelado':
            return 'danger';
        case 'nao_compareceu':
            return 'warning';
        default:
            return 'secondary';
    }
}

function configurarEventos() {
    document.getElementById('editProfileBtn').addEventListener('click', function () {
        const editModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        editModal.show();
    });
    document.getElementById('saveProfileBtn').addEventListener('click', function () {
        salvarAlteracoesPerfil();
    });
    document.getElementById('logoutBtn').addEventListener('click', function () {
        fazerLogout();
    });
}

async function salvarAlteracoesPerfil() {
    const novoNome = document.getElementById('editName').value;
    const novoEmail = document.getElementById('editEmail').value;
    const novoTelefone = document.getElementById('editPhone').value;
    const token = localStorage.getItem('token');

    if (!novoNome || !novoEmail) {
        alert('Por favor, preencha pelo menos nome e email.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/meu-perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: novoNome,
                email: novoEmail,
                telefone: novoTelefone
            })
        });

        if (response.status === 404) {
            throw new Error('Edição não implementada no backend');
        }

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Atualiza localStorage com dados do servidor
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('nome', data.usuario.nome);
        localStorage.setItem('email', data.usuario.email);

        carregarInformacoesUsuario();

        const editModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        editModal.hide();

        alert('Perfil atualizado com sucesso!');

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
    }
}

function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        const token = localStorage.getItem('token');

        fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .catch(error => {
                console.error('Erro ao fazer logout no servidor:', error);
            })
            .finally(() => {
                limparLocalStorage();
                window.location.href = '../index.html';
            });
    }
}

function limparLocalStorage() {
    const itensParaManter = ['idioma', 'tema'];

    localStorage.removeItem('loggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('nome');
    localStorage.removeItem('email');
    localStorage.removeItem('tipo');
}

async function cancelarAgendamento(agendamentoId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/agendamentos/${agendamentoId}/cancelar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || `Erro HTTP: ${response.status}`);
        }

        const resultado = await response.json();

        alert('Agendamento cancelado com sucesso!');

        carregarAgendamentos(token);

    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        alert(`Erro ao cancelar agendamento: ${error.message}`);
    }
}

function carregarAgendamentos(token) {
    const appointmentsContainer = document.getElementById('userAppointments');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    fetch(`${API_URL}/agendamentos`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.status === 401) {
                fazerLogout();
                throw new Error('Token inválido');
            }
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(agendamentos => {
            if (!agendamentos || !Array.isArray(agendamentos)) {
                throw new Error('Resposta inválida da API');
            }

            const usuarioId = JSON.parse(localStorage.getItem('usuario'))._id;
            const meusAgendamentos = agendamentos.filter(ag =>
                ag.usuario_id && ag.usuario_id._id === usuarioId
            );

            if (meusAgendamentos.length > 0) {
                let html = '';
                meusAgendamentos.forEach(agendamento => {
                    const dataAgendamento = agendamento.inicio_sessao ?
                        new Date(agendamento.inicio_sessao).toLocaleString('pt-BR') :
                        'Não definida';

                    // Verificar se o agendamento pode ser cancelado
                    const podeCancelar = (agendamento.status === 'agendado' || agendamento.status === 'confirmado');
                    const dataSessao = agendamento.inicio_sessao ? new Date(agendamento.inicio_sessao) : null;
                    const agora = new Date();
                    const horasAntecedencia = 1; // AGORA: 1 hora de antecedência
                    const dentroDoPrazo = dataSessao && (dataSessao - agora) > (horasAntecedencia * 60 * 60 * 1000);
                    const tempoRestante = dataSessao ? calcularTempoRestante(dataSessao) : '';

                    html += `
                <div class="appointment-item mb-3 p-3 border rounded">
                    <div class="row">
                        <div class="col-md-6">
                            <strong>Serviço:</strong> ${agendamento.servico_id?.nome_servico || 'Massagem'}
                        </div>
                        <div class="col-md-6">
                            <strong>Data:</strong> ${dataAgendamento}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <strong>Unidade:</strong> ${agendamento.unidade_id?.nome_unidade || 'Não definida'}
                        </div>
                        <div class="col-md-6">
                            <strong>Status:</strong> 
                            <span class="badge bg-${getBadgeColor(agendamento.status)}">
                                ${formatarStatus(agendamento.status)}
                            </span>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <strong>Terapeuta:</strong> ${agendamento.terapeuta_id?.nome_colaborador || 'Não definido'}
                        </div>
                        <div class="col-md-6">
                            <strong>Valor:</strong> R$ ${agendamento.valor?.toFixed(2) || '0,00'}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <strong>Tempo restante:</strong> ${tempoRestante}
                        </div>
                    </div>
                    ${agendamento.observacoes ? `
                    <div class="row mt-2">
                        <div class="col-12">
                            <strong>Observações:</strong> ${agendamento.observacoes}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Botão de Cancelar -->
                    ${podeCancelar && dentroDoPrazo ? `
                    <div class="row mt-3">
                        <div class="col-12 text-end">
                            <button class="btn btn-sm btn-outline-danger" 
                                    onclick="cancelarAgendamento('${agendamento._id}')"
                                    title="Cancelar agendamento">
                                <i class="fa-solid fa-xmark me-1"></i>Cancelar Agendamento
                            </button>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${podeCancelar && !dentroDoPrazo && dataSessao > agora ? `
                    <div class="row mt-2">
                        <div class="col-12">
                            <small class="text-warning">
                                <i class="fa-solid fa-clock me-1"></i>
                                Cancelamento permitido até 1 hora antes do horário marcado
                            </small>
                        </div>
                    </div>
                    ` : ''}

                    ${dataSessao && dataSessao <= agora ? `
                    <div class="row mt-2">
                        <div class="col-12">
                            <small class="text-muted">
                                <i class="fa-solid fa-ban me-1"></i>
                                Este agendamento já foi realizado ou está em andamento
                            </small>
                        </div>
                    </div>
                    ` : ''}
                </div>
                `;
                });
                appointmentsContainer.innerHTML = html;
            } else {
                appointmentsContainer.innerHTML = '<p class="text-muted">Nenhum agendamento encontrado.</p>';
            }
        })
        .catch(error => {
            appointmentsContainer.innerHTML = `
            <p class="text-muted">Erro ao carregar agendamentos: ${error.message}</p>
            <button class="btn btn-sm btn-primary mt-2" onclick="carregarAgendamentos(localStorage.getItem('token'))">
                Tentar Novamente
            </button>
        `;
        });
}

// Função para calcular tempo restante
function calcularTempoRestante(dataAgendamento) {
    const agora = new Date();
    const diferencaMs = dataAgendamento - agora;

    if (diferencaMs < 0) {
        return 'Já passou';
    }

    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
    const diferencaHoras = Math.floor(diferencaMinutos / 60);
    const minutosRestantes = diferencaMinutos % 60;

    if (diferencaHoras > 0) {
        return `${diferencaHoras}h ${minutosRestantes}min`;
    } else {
        return `${minutosRestantes} minutos`;
    }
}

// Função auxiliar para formatar o status em português
function formatarStatus(status) {
    const statusMap = {
        'agendado': 'Agendado',
        'confirmado': 'Confirmado',
        'cancelado': 'Cancelado',
        'concluído': 'Concluído',
        'realizado': 'Realizado',
        'nao_compareceu': 'Não Compareceu'
    };
    return statusMap[status] || status;
}