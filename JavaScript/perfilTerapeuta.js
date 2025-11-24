// Configurações da API
const API_BASE = 'http://localhost:3000';
let token = localStorage.getItem('token');

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacao();
    carregarDadosPerfil();
    configurarEventos();
});

function verificarAutenticacao() {
    if (!token) {
        window.location.href = '/Login/login-funcionario.html';
        return;
    }
}

function configurarEventos() {
    document.getElementById('formInformacoesPessoais').addEventListener('submit', salvarInformacoesPessoais);
    document.getElementById('formAlterarSenha').addEventListener('submit', alterarSenha);
}

async function carregarDadosPerfil() {
    try {
        mostrarLoading(true);

        const usuarioData = JSON.parse(localStorage.getItem('usuario'));
        if (!usuarioData || !usuarioData.id) {
            throw new Error('Dados do usuário não encontrados');
        }

        const userId = usuarioData.id;

        // Tenta primeiro o endpoint específico para perfil do colaborador
        let response = await fetch(`${API_BASE}/meu-perfil-colaborador`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            preencherDadosPerfil(data);
            mostrarLoading(false);
            return;
        }

        await carregarDadosAlternativo(usuarioData);

    } catch (error) {
        console.error('Erro detalhado:', error);
        mostrarAlerta('Erro ao carregar dados do perfil: ' + error.message, 'error');
        mostrarLoading(false);
    }
}

async function carregarDadosAlternativo(usuarioData) {
    try {
        const response = await fetch(`${API_BASE}/colaboradores`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Não foi possível carregar os dados dos colaboradores');
        }

        const colaboradores = await response.json();

        const colaborador = colaboradores.find(col =>
            col._id === usuarioData.id || col.email === usuarioData.email
        );

        if (colaborador) {
            preencherDadosPerfil(colaborador);
        } else {
            throw new Error('Colaborador não encontrado na lista');
        }

        mostrarLoading(false);
    } catch (error) {
        console.error('Erro no método alternativo:', error);
        mostrarAlerta('Erro ao carregar dados: ' + error.message, 'error');
        mostrarLoading(false);
    }
}

function preencherDadosPerfil(dados) {
    const dadosColaborador = dados.colaborador || dados;
    document.getElementById('inputNome').value = dadosColaborador.nome_colaborador || dadosColaborador.nome || '';
    document.getElementById('inputEmail').value = dadosColaborador.email || '';
    document.getElementById('inputTelefone').value = dadosColaborador.telefone || '';
}

async function salvarInformacoesPessoais(event) {
    event.preventDefault();

    try {
        const btnSalvar = document.getElementById('btnSalvarInfo');
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';

        const dados = {
            nome: document.getElementById('inputNome').value,
            email: document.getElementById('inputEmail').value,
            telefone: document.getElementById('inputTelefone').value
        };

        if (!dados.nome || !dados.email) {
            throw new Error('Nome e e-mail são obrigatórios');
        }

        let response = await fetch(`${API_BASE}/meu-perfil-colaborador`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        if (response.status === 401 || response.status === 404) {
            const usuarioData = JSON.parse(localStorage.getItem('usuario'));
            const userId = usuarioData.id;

            if (!userId) {
                throw new Error('ID do usuário não encontrado');
            }

            response = await fetch(`${API_BASE}/colaboradores/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dados)
            });
        }

        if (!response.ok) {
            const erroData = await response.json().catch(() => ({ erro: 'Erro desconhecido' }));
            throw new Error(erroData.erro || 'Erro ao salvar alterações');
        }

        const resultado = await response.json();

        const usuarioData = JSON.parse(localStorage.getItem('usuario'));
        if (usuarioData) {
            usuarioData.nome = dados.nome;
            usuarioData.email = dados.email;
            localStorage.setItem('usuario', JSON.stringify(usuarioData));
        }

        mostrarAlerta('Informações salvas com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarAlerta(error.message, 'error');
    } finally {
        const btnSalvar = document.getElementById('btnSalvarInfo');
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = '<i class="fas fa-save me-2"></i>Salvar Alterações';
    }
}

async function alterarSenha(event) {
    event.preventDefault();

    try {
        const btnAlterar = document.getElementById('btnAlterarSenha');
        btnAlterar.disabled = true;
        btnAlterar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Alterando...';

        const senhaAtual = document.getElementById('inputSenhaAtual').value;
        const novaSenha = document.getElementById('inputNovaSenha').value;
        const confirmarSenha = document.getElementById('inputConfirmarSenha').value;

        if (!senhaAtual) {
            throw new Error('Digite a senha atual');
        }

        if (!novaSenha) {
            throw new Error('Digite a nova senha');
        }

        if (novaSenha !== confirmarSenha) {
            throw new Error('As senhas não coincidem');
        }

        if (novaSenha.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        const response = await fetch(`${API_BASE}/alterar-senha`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                senhaAtual: senhaAtual,
                novaSenha: novaSenha
            })
        });

        if (!response.ok) {
            const erroData = await response.json();
            throw new Error(erroData.erro || 'Erro ao alterar senha');
        }

        const resultado = await response.json();

        document.getElementById('formAlterarSenha').reset();
        mostrarAlerta('Senha alterada com sucesso!', 'success');

    } catch (error) {
        console.error('Erro:', error);
        mostrarAlerta(error.message, 'error');
    } finally {
        const btnAlterar = document.getElementById('btnAlterarSenha');
        btnAlterar.disabled = false;
        btnAlterar.innerHTML = '<i class="fas fa-key me-2"></i>Alterar Senha';
    }
}

function mostrarAlerta(mensagem, tipo) {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="fas ${icon} me-2"></i>
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function mostrarLoading(mostrar) {
    const btnSalvar = document.getElementById('btnSalvarInfo');
    const btnAlterar = document.getElementById('btnAlterarSenha');

    if (mostrar) {
        btnSalvar.disabled = true;
        btnAlterar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Carregando...';
    } else {
        btnSalvar.disabled = false;
        btnAlterar.disabled = false;
        btnSalvar.innerHTML = '<i class="fas fa-save me-2"></i>Salvar Alterações';
    }
}

function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('sessaoId');
        localStorage.removeItem('usuario');
        localStorage.removeItem('nome');
        localStorage.removeItem('email');
        localStorage.removeItem('tipo');
        localStorage.removeItem('userId');
        window.location.href = '/Login/login-funcionario.html';
    }
}