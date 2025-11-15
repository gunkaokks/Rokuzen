// URL da API
const API_URL = 'http://localhost:3000';

async function descobrirRotasDaAPI() {
    try {
        const token = localStorage.getItem('token');
        console.log('🔍 Explorando rotas da API...');
        
        // Testa várias rotas possíveis
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

// Chame esta função no DOMContentLoaded
// descobrirRotasDaAPI();

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ perfil.js carregado - DOM pronto');

    // Verificação de login
    const loggedIn = localStorage.getItem("loggedIn");
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    console.log('📋 Dados do localStorage:');
    console.log('- loggedIn:', loggedIn);
    console.log('- token:', token ? '✔️ Presente' : '❌ Ausente');
    console.log('- usuario:', usuario);

    if (!loggedIn || loggedIn !== "true" || !token || !usuario) {
        console.log('❌ Usuário não logado, redirecionando...');
        window.location.href = '../Login/login.html';
        return;
    }

    console.log('👤 Usuário logado:', JSON.parse(usuario));

    // Inicializar
    carregarInformacoesUsuario();
    configurarEventos();
});

function carregarInformacoesUsuario() {
    console.log('🔄 Carregando informações do usuário...');

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const token = localStorage.getItem('token');

    console.log('📊 Dados do usuário para exibir:', usuario);

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

    console.log('✅ Informações básicas carregadas');

    // Carregar agendamentos
    carregarAgendamentos(token);
}

function carregarAgendamentos(token) {
    console.log('📅 Tentando carregar agendamentos...');

    const appointmentsContainer = document.getElementById('userAppointments');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    console.log('👤 ID do usuário para filtro:', usuario._id);

    fetch(`${API_URL}/agendamentos`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('📡 Resposta da API - Status:', response.status);

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
            console.log('✅ Agendamentos recebidos:', agendamentos);

            if (!agendamentos || !Array.isArray(agendamentos)) {
                throw new Error('Resposta inválida da API');
            }

            const usuarioId = JSON.parse(localStorage.getItem('usuario'))._id;
            console.log('🔍 Filtrando agendamentos para usuário:', usuarioId);

            const meusAgendamentos = agendamentos.filter(ag =>
                ag.usuario_id && ag.usuario_id._id === usuarioId
            );

            console.log('📋 Meus agendamentos filtrados:', meusAgendamentos);

            if (meusAgendamentos.length > 0) {
                let html = '';
                meusAgendamentos.forEach(agendamento => {
                    console.log('📝 Processando agendamento:', agendamento);

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
                console.log('✅ Agendamentos exibidos com sucesso');
            } else {
                appointmentsContainer.innerHTML = '<p class="text-muted">Nenhum agendamento encontrado.</p>';
                console.log('ℹ️ Nenhum agendamento encontrado para este usuário');
            }
        })
        .catch(error => {
            console.error('❌ Erro ao carregar agendamentos:', error);
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

    console.log('🔄 Tentando atualizar perfil...');

    try {
        // Tenta a rota mais comum para edição de perfil
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

        console.log('📡 Status da resposta:', response.status);

        if (response.status === 404) {
            // Se a rota não existe, salva apenas localmente
            throw new Error('Rota de edição não implementada no backend');
        }

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Perfil atualizado no servidor:', data);

        // Atualiza localStorage com dados do servidor
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('nome', data.usuario.nome);
        localStorage.setItem('email', data.usuario.email);

        carregarInformacoesUsuario();
        
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        editModal.hide();

        alert('✅ Perfil atualizado com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        
        // FALLBACK: Salva apenas localmente
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        usuario.nome = novoNome;
        usuario.email = novoEmail;
        usuario.telefone = novoTelefone;
        
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('nome', novoNome);
        localStorage.setItem('email', novoEmail);
        
        carregarInformacoesUsuario();
        
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        editModal.hide();
        
        alert(`✅ Alterações salvas localmente!\n\n💡 Para salvar no servidor, é necessário:\n1. Criar a rota PUT /meu-perfil no backend\n2. Implementar middleware de autenticação\n3. Configurar a atualização no MongoDB\n\nErro técnico: ${error.message}`);
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