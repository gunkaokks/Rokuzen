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
    // Formulário de informações pessoais
    document.getElementById('formInformacoesPessoais').addEventListener('submit', salvarInformacoesPessoais);

    // Formulário de alterar senha
    document.getElementById('formAlterarSenha').addEventListener('submit', alterarSenha);
}

async function carregarDadosPerfil() {
    try {
        mostrarLoading(true);

        const response = await fetch(`${API_BASE}/meu-perfil`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar perfil');

        const data = await response.json();
        preencherDadosPerfil(data.usuario);
        mostrarLoading(false);

    } catch (error) {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao carregar dados do perfil', 'error');
        mostrarLoading(false);
    }
}

function preencherDadosPerfil(usuario) {
    document.getElementById('inputNome').value = usuario.nome || '';
    document.getElementById('inputEmail').value = usuario.email || '';
    document.getElementById('inputTelefone').value = usuario.telefone || '';
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

        // Validação básica
        if (!dados.nome || !dados.email) {
            throw new Error('Nome e e-mail são obrigatórios');
        }

        const response = await fetch(`${API_BASE}/meu-perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const erroData = await response.json();
            throw new Error(erroData.erro || 'Erro ao salvar alterações');
        }

        const resultado = await response.json();
        mostrarAlerta('Informações salvas com sucesso!', 'success');

    } catch (error) {
        console.error('Erro:', error);
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

        // Validações
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
        
        // Limpar formulário
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
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-error';
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} fade-in`;
    alertDiv.innerHTML = `
                <i class="fas ${icon} me-2"></i>
                ${mensagem}
            `;

    alertContainer.appendChild(alertDiv);

    // Remover alerta após 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function mostrarLoading(mostrar) {
    const btnSalvar = document.getElementById('btnSalvarInfo');
    const btnAlterar = document.getElementById('btnAlterarSenha');

    if (mostrar) {
        btnSalvar.disabled = true;
        btnAlterar.disabled = true;
    } else {
        btnSalvar.disabled = false;
        btnAlterar.disabled = false;
    }
}