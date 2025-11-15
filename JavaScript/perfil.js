
document.addEventListener('DOMContentLoaded', function () {
    if (!verificarAutenticacao()) {
        return;
    }
    carregarInformacoesUsuario();

    configurarEventos();
});

function verificarAutenticacao() {
    const loggedIn = localStorage.getItem("loggedIn");
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (!loggedIn || loggedIn !== "true" || !token || !usuario) {
        window.location.href = '/Login/login.html';
        return false;
    }

    return true;
}

function carregarInformacoesUsuario() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const token = localStorage.getItem('token');

    document.getElementById('userName').textContent = usuario.nome || 'Não informado';
    document.getElementById('userEmail').textContent = usuario.email || 'Não informado';
    document.getElementById('userPhone').textContent = usuario.telefone || 'Não informado';

    if (usuario.dataCadastro) {
        const data = new Date(usuario.dataCadastro);
        document.getElementById('userSince').textContent = data.toLocaleDateString('pt-BR');
    } else {
        document.getElementById('userSince').textContent = 'Data não disponível';
    }

    document.getElementById('editName').value = usuario.nome || '';
    document.getElementById('editEmail').value = usuario.email || '';
    document.getElementById('editPhone').value = usuario.telefone || '';

    carregarAgendamentos(token);
}

function carregarAgendamentos(token) {
    const appointmentsContainer = document.getElementById('userAppointments');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    fetch(`http://localhost:3000/agendamentos/${usuario._id || usuario.id}`, {
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
                throw new Error('Erro ao carregar agendamentos');
            }
            return response.json();
        })
        .then(data => {
            const agendamentos = data.agendamentos || data || [];

            if (agendamentos.length > 0) {
                let html = '';
                agendamentos.forEach(agendamento => {
                    const dataAgendamento = agendamento.data ?
                        new Date(agendamento.data).toLocaleString('pt-BR') :
                        'Não definida';

                    html += `
                    <div class="appointment-item mb-3 p-3 border rounded">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Serviço:</strong> ${agendamento.servico || agendamento.tipoServico || 'Massagem'}
                            </div>
                            <div class="col-md-6">
                                <strong>Data:</strong> ${dataAgendamento}
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <strong>Unidade:</strong> ${agendamento.unidade || agendamento.local || 'Não definida'}
                            </div>
                            <div class="col-md-6">
                                <strong>Status:</strong> 
                                <span class="badge bg-${getBadgeColor(agendamento.status)}">
                                    ${agendamento.status || 'pendente'}
                                </span>
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
            console.error('Erro ao carregar agendamentos:', error);
            appointmentsContainer.innerHTML = '<p class="text-muted">Erro ao carregar agendamentos.</p>';
        });
}

function getBadgeColor(status) {
    switch (status?.toLowerCase()) {
        case 'confirmado':
        case 'concluído':
            return 'success';
        case 'cancelado':
            return 'danger';
        case 'pendente':
            return 'warning';
        default:
            return 'secondary';
    }
}

function configurarEventos() {
    // Botão de editar perfil
    document.getElementById('editProfileBtn').addEventListener('click', function () {
        const editModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        editModal.show();
    });

    // Botão de salvar perfil
    document.getElementById('saveProfileBtn').addEventListener('click', function () {
        salvarAlteracoesPerfil();
    });

    // Botão de logout
    document.getElementById('logoutBtn').addEventListener('click', function () {
        fazerLogout();
    });
}

function salvarAlteracoesPerfil() {
    const novoNome = document.getElementById('editName').value;
    const novoEmail = document.getElementById('editEmail').value;
    const novoTelefone = document.getElementById('editPhone').value;
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!novoNome || !novoEmail) {
        alert('Por favor, preencha pelo menos nome e email.');
        return;
    }

    if (!verificarAutenticacao()) {
        return;
    }

    fetch(`http://localhost:3000/usuarios/${usuario._id || usuario.id}`, {
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
    })
        .then(response => {
            if (response.status === 401) {
                fazerLogout();
                throw new Error('Token inválido');
            }
            if (!response.ok) {
                throw new Error('Erro ao atualizar perfil');
            }
            return response.json();
        })
        .then(data => {
            const usuarioAtualizado = data.usuario || data;

            localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
            localStorage.setItem('nome', usuarioAtualizado.nome);
            localStorage.setItem('email', usuarioAtualizado.email);

            carregarInformacoesUsuario();

            const editModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            editModal.hide();

            alert('Perfil atualizado com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil. Tente novamente.');
        });
}

function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        const token = localStorage.getItem('token');

        fetch('http://localhost:3000/logout', {
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
    const todosItens = Object.keys(localStorage);

    todosItens.forEach(item => {
        if (!itensParaManter.includes(item)) {
            localStorage.removeItem(item);
        }
    });
}

setInterval(() => {
    if (localStorage.getItem('loggedIn') === 'true') {
        verificarConexao();
    }
}, 300000);

function verificarConexao() {
    const token = localStorage.getItem('token');

    fetch('http://localhost:3000/verificar-token', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (response.status === 401) {
                fazerLogout();
            }
        })
        .catch(error => {
            console.error('Erro ao verificar conexão:', error);
        });
}