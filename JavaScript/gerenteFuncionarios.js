// Configurações da API
const API_BASE = 'http://localhost:3000';
let token = localStorage.getItem('token');
let funcionarioEditando = null;

// Elementos da interface
const modalCadastroFuncionario = new bootstrap.Modal(document.getElementById('modalCadastroFuncionario'));
const modalEdicaoFuncionario = new bootstrap.Modal(document.getElementById('modalEdicaoFuncionario'));

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacao();
    configurarEventos();
    carregarFuncionarios();
    carregarUnidades();
});

function verificarAutenticacao() {
    if (!token) {
        window.location.href = '/Login/login-funcionario.html';
        return;
    }
}

function configurarEventos() {
    // Pesquisa
    document.getElementById('pesquisa-funcionarios').addEventListener('input', function () {
        filtrarTabela('corpo-tabela-funcionarios', this.value.toLowerCase());
    });

    // Salvar cadastro
    document.getElementById('salvarCadastroFuncionario').addEventListener('click', salvarCadastroFuncionario);

    // Salvar edição
    document.getElementById('salvarEdicaoFuncionario').addEventListener('click', salvarEdicaoFuncionario);
}

async function carregarUnidades() {
    try {
        const response = await fetch(`${API_BASE}/unidades`);
        if (!response.ok) throw new Error('Erro ao carregar unidades');

        const unidades = await response.json();
        const selectUnidade = document.getElementById('unidade-cadastro');

        unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade._id;
            option.textContent = unidade.nome_unidade;
            selectUnidade.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar unidades:', error);
    }
}

function abrirModalCadastro() {
    document.getElementById('form-cadastro-funcionario').reset();
    modalCadastroFuncionario.show();
}

async function salvarCadastroFuncionario() {
    try {
        const tipoSelecionado = document.getElementById('tipo-cadastro').value;
        const tipoNumerico = {
            'recepcionista': 3,
            'terapeuta': 4
        }[tipoSelecionado];

        const dados = {
            nome_colaborador: document.getElementById('nome-cadastro').value,
            email: document.getElementById('email-cadastro').value,
            telefone: document.getElementById('telefone-cadastro').value,
            tipo_colaborador: tipoNumerico,
            especialidades: document.getElementById('especialidades-cadastro').value.split(',').map(e => e.trim()),
            unidade_id: document.getElementById('unidade-cadastro').value || null
        };

        // Validações básicas
        if (!dados.nome_colaborador || !dados.email || !dados.telefone || !dados.tipo_colaborador) {
            mostrarErro('Preencha todos os campos obrigatórios');
            return;
        }

        const response = await fetch(`${API_BASE}/colaboradores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro ao cadastrar funcionário');
        }

        modalCadastroFuncionario.hide();
        carregarFuncionarios();
        mostrarSucesso('Funcionário cadastrado com sucesso!');

    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao cadastrar funcionário');
    }
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
            const tipoLegivel = {
                1: 'Sócio',
                2: 'Gerente',
                3: 'Recepcionista',
                4: 'Terapeuta'
            }[funcionario.tipo_colaborador] || 'N/A';

            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${funcionario.nome || funcionario.nome_colaborador || 'N/A'}</td>
                <td>${funcionario.email || 'N/A'}</td>
                <td>${funcionario.telefone || 'N/A'}</td>
                <td>${tipoLegivel}</td>
                <td>${funcionario.especialidades?.join(', ') || 'N/A'}</td>
                <td>${funcionario.unidade_id?.nome_unidade || 'N/A'}</td>
                <td>${formatarDataHora(funcionario.createdAt)}</td>
                <td>
                    <button class="btn btn-gerente-card-roxo btn-sm" onclick="editarFuncionario('${funcionario._id}')">
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
        const response = await fetch(`${API_BASE}/colaboradores/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar funcionário');
        const funcionario = await response.json();

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
    if (!funcionarioEditando) {
        mostrarErro('Nenhum funcionário selecionado para edição');
        return;
    }

    try {
        const dados = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            especialidades: document.getElementById('especialidades').value.split(',').map(e => e.trim())
        };

        if (!dados.nome || !dados.email || !dados.telefone) {
            mostrarErro('Preencha todos os campos obrigatórios');
            return;
        }

        const response = await fetch(`${API_BASE}/colaboradores/${funcionarioEditando._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const erroData = await response.json();
            console.error('Erro da API:', erroData);
            throw new Error(erroData.erro || `Erro ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();

        carregarFuncionarios();
        modalEdicaoFuncionario.hide();
        funcionarioEditando = null;
        mostrarSucesso('Alterações salvas com sucesso!');

    } catch (error) {
        console.error('Erro detalhado:', error);
        mostrarErro(error.message || 'Erro ao salvar alterações');
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