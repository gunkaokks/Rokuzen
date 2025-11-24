class RecepcaoAgendamentosManager {
    constructor() {
        this.agendamentos = [];
        this.servicos = [];
        this.terapeutas = [];
        this.unidades = [];
        this.agendamentoParaCancelar = null;

        this.init();
    }

    async init() {
        await this.verificarAutenticacao();
        await this.carregarDados();
        await this.carregarAgendamentos();
        this.configurarEventos();
    }

    async verificarAutenticacao() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../Login/login.html';
                return;
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = '../Login/login.html';
        }
    }

    async carregarDados() {
        try {
            const token = localStorage.getItem('token');

            // Carregar serviços
            const responseServicos = await fetch('http://localhost:3000/servicos', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (responseServicos.ok) {
                this.servicos = await responseServicos.json();
                this.preencherSelectServicos();
            }

            // Carregar terapeutas
            const responseTerapeutas = await fetch('http://localhost:3000/colaboradores', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (responseTerapeutas.ok) {
                const colaboradores = await responseTerapeutas.json();
                this.terapeutas = colaboradores.filter(colab => colab.tipo_colaborador === 4);
                this.preencherSelectTerapeutas();
            }

            // Carregar unidades
            const responseUnidades = await fetch('http://localhost:3000/unidades', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (responseUnidades.ok) {
                this.unidades = await responseUnidades.json();
                this.preencherSelectUnidades();
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.mostrarErro('Erro ao carregar dados do sistema');
        }
    }

    preencherSelectServicos() {
        const select = document.getElementById('servicoSelect');
        select.innerHTML = '<option value="">Selecione um serviço</option>';
        this.servicos.forEach(servico => {
            const option = document.createElement('option');
            option.value = servico._id;
            option.textContent = servico.nome_servico;
            select.appendChild(option);
        });
    }

    preencherSelectTerapeutas() {
        const select = document.getElementById('terapeutaSelect');
        select.innerHTML = '<option value="">Selecione um terapeuta</option>';
        this.terapeutas.forEach(terapeuta => {
            const option = document.createElement('option');
            option.value = terapeuta._id;
            option.textContent = terapeuta.nome_colaborador;
            select.appendChild(option);
        });
    }

    preencherSelectUnidades() {
        const select = document.getElementById('unidadeSelect');
        select.innerHTML = '<option value="">Selecione uma unidade</option>';
        this.unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade._id;
            option.textContent = unidade.nome_unidade;
            select.appendChild(option);
        });
    }

    async carregarAgendamentos() {
        try {
            const token = localStorage.getItem('token');

            this.mostrarLoading(true);

            const response = await fetch(`http://localhost:3000/agendamentos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar agendamentos');
            }

            const todosAgendamentos = await response.json();

            // Filtrar agendamentos da semana
            this.agendamentos = this.filtrarAgendamentosSemana(todosAgendamentos);

            this.exibirAgendamentos();

        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.mostrarErro('Erro ao carregar agendamentos');
        } finally {
            this.mostrarLoading(false);
        }
    }

    filtrarAgendamentosSemana(agendamentos) {
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        inicioSemana.setHours(0, 0, 0, 0);

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);

        return agendamentos.filter(agendamento => {
            const dataAgendamento = new Date(agendamento.inicio_sessao);
            return dataAgendamento >= inicioSemana &&
                dataAgendamento <= fimSemana &&
                agendamento.status !== 'cancelado';
        });
    }

    exibirAgendamentos() {
        const tbody = document.getElementById('corpo-tabela-agendamentos');
        const semDados = document.getElementById('semAgendamentos');

        if (this.agendamentos.length === 0) {
            tbody.innerHTML = '';
            semDados.style.display = 'block';
            return;
        }

        semDados.style.display = 'none';

        const agendamentosOrdenados = this.agendamentos.sort((a, b) =>
            new Date(a.inicio_sessao) - new Date(b.inicio_sessao)
        );

        tbody.innerHTML = agendamentosOrdenados.map(agendamento => `
            <tr>
                <td><strong>${agendamento.usuario_id?.nome || 'N/A'}</strong></td>
                <td>
                    <small class="text-muted">
                        ${agendamento.usuario_id?.email || 'N/A'}<br>
                        ${agendamento.usuario_id?.telefone || 'N/A'}
                    </small>
                </td>
                <td>${agendamento.servico_id?.nome_servico || 'N/A'}</td>
                <td>
                    ${new Date(agendamento.inicio_sessao).toLocaleDateString('pt-BR')}<br>
                    <small class="text-muted">
                        ${new Date(agendamento.inicio_sessao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </small>
                </td>
                <td>${agendamento.terapeuta_id?.nome_colaborador || 'N/A'}</td>
                <td>${agendamento.unidade_id?.nome_unidade || 'N/A'}</td>
                <td>
                    <span class="badge ${this.getBadgeStatus(agendamento.status)}">
                        ${agendamento.status || 'agendado'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-cancelar" data-id="${agendamento._id}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.btn-cancelar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const agendamentoId = e.target.closest('.btn-cancelar').dataset.id;
                this.prepararCancelamento(agendamentoId);
            });
        });
    }

    getBadgeStatus(status) {
        switch (status) {
            case 'agendado': return 'bg-primary';
            case 'confirmado': return 'bg-success';
            case 'cancelado': return 'bg-danger';
            case 'realizado': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    prepararCancelamento(agendamentoId) {
        const agendamento = this.agendamentos.find(a => a._id === agendamentoId);
        if (!agendamento) return;

        this.agendamentoParaCancelar = agendamentoId;

        document.getElementById('clienteCancelamento').textContent = agendamento.usuario_id?.nome || 'N/A';
        document.getElementById('dataCancelamento').textContent =
            `${new Date(agendamento.inicio_sessao).toLocaleString('pt-BR')}`;

        const modal = new bootstrap.Modal(document.getElementById('modalCancelamento'));
        modal.show();
    }

    async confirmarCancelamento() {
        try {
            console.log('=== INICIANDO CANCELAMENTO ===');

            const token = localStorage.getItem('token');
            console.log('Token encontrado:', !!token);

            if (!token) {
                this.mostrarErro('Token de autenticação não encontrado.');
                return;
            }

            // Obter o ID do usuário logado do token
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Payload do token:', payload);

            const usuarioId = payload.userId || payload.id;
            console.log('ID do usuário:', usuarioId);

            if (!usuarioId) {
                this.mostrarErro('ID do usuário não encontrado no token.');
                return;
            }

            console.log('Agendamento a cancelar:', this.agendamentoParaCancelar);

            const url = `http://localhost:3000/agendamentos/${this.agendamentoParaCancelar}/cancelar`;
            console.log('URL da requisição:', url);

            const requestOptions = {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cancelado_por: usuarioId
                })
            };

            console.log('Opções da requisição:', requestOptions);

            const response = await fetch(url, requestOptions);
            console.log('Status da resposta:', response.status);
            console.log('OK:', response.ok);

            if (!response.ok) {
                const erroText = await response.text();
                console.error('Texto do erro:', erroText);

                if (response.status === 404) {
                    throw new Error('Agendamento não encontrado');
                } else if (response.status === 403) {
                    throw new Error('Você não tem permissão para cancelar este agendamento');
                } else if (response.status === 400) {
                    throw new Error('Não é possível cancelar este agendamento (já passou do horário ou está muito próximo)');
                } else {
                    throw new Error(`Erro ${response.status}: ${erroText}`);
                }
            }

            const resultado = await response.json();
            console.log('Resultado do cancelamento:', resultado);

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCancelamento'));
            if (modal) {
                modal.hide();
            }

            this.mostrarMensagem('Agendamento cancelado com sucesso!');
            await this.carregarAgendamentos();

        } catch (error) {
            console.error('=== ERRO COMPLETO ===', error);
            this.mostrarErro('Erro ao cancelar agendamento: ' + error.message);

            // Fechar modal em caso de erro
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCancelamento'));
            if (modal) {
                modal.hide();
            }
        }
    }

    async criarAgendamento(dadosAgendamento) {
        try {
            const token = localStorage.getItem('token');

            console.log('Enviando dados para agendamento:', dadosAgendamento);

            // Usar a nova rota específica para recepção
            const response = await fetch('http://localhost:3000/agendamentos/recepcao', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosAgendamento)
            });

            if (!response.ok) {
                const erroText = await response.text();
                console.error('Erro da API:', erroText);
                throw new Error(`Erro ao criar agendamento: ${response.status} - ${erroText}`);
            }

            const resultado = await response.json();
            console.log('Agendamento criado com sucesso:', resultado);
            return resultado;

        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            throw error;
        }
    }

    configurarEventos() {
        document.getElementById('formNovoAgendamento').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processarNovoAgendamento();
        });

        document.getElementById('confirmarCancelamento').addEventListener('click', () => {
            this.confirmarCancelamento();
        });

        document.getElementById('btnAtualizarLista').addEventListener('click', () => {
            this.carregarAgendamentos();
        });

        document.getElementById('pesquisa-agendamentos').addEventListener('input', (e) => {
            this.filtrarAgendamentos(e.target.value);
        });

        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('agendamentoData').min = hoje;
        document.getElementById('agendamentoData').value = hoje;
    }

    async processarNovoAgendamento() {
        try {
            const nome = document.getElementById('clienteNome').value.trim();
            const email = document.getElementById('clienteEmail').value.trim();
            const telefone = document.getElementById('clienteTelefone').value.trim();
            const servicoId = document.getElementById('servicoSelect').value;
            const terapeutaId = document.getElementById('terapeutaSelect').value;
            const unidadeId = document.getElementById('unidadeSelect').value;
            const data = document.getElementById('agendamentoData').value;
            const horaInicio = document.getElementById('agendamentoHoraInicio').value;
            const observacoes = document.getElementById('agendamentoObservacoes').value;

            // Validação básica
            if (!nome || !email || !telefone || !servicoId || !terapeutaId || !unidadeId || !data || !horaInicio) {
                this.mostrarErro('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            const duracao = parseInt(document.getElementById('agendamentoDuracao').value) || 60;
            const inicioSessao = new Date(`${data}T${horaInicio}`);
            const fimSessao = new Date(inicioSessao.getTime() + duracao * 60000);

            const dadosAgendamento = {
                nome: nome,
                email: email,
                telefone: telefone,
                servico_id: servicoId,
                terapeuta_id: terapeutaId,
                unidade_id: unidadeId,
                inicio_sessao: inicioSessao.toISOString(),
                fim_sessao: fimSessao.toISOString(),
                observacoes: observacoes
            };

            console.log('Processando agendamento:', dadosAgendamento);

            const resultado = await this.criarAgendamento(dadosAgendamento);

            this.mostrarMensagem('Agendamento realizado com sucesso!');

            // Limpar formulário
            document.getElementById('formNovoAgendamento').reset();
            document.getElementById('agendamentoData').value = new Date().toISOString().split('T')[0];

            await this.carregarAgendamentos();

        } catch (error) {
            console.error('Erro ao processar agendamento:', error);
            this.mostrarErro('Erro ao realizar agendamento: ' + error.message);
        }
    }

    filtrarAgendamentos(termo) {
        const tbody = document.getElementById('corpo-tabela-agendamentos');
        const linhas = tbody.getElementsByTagName('tr');
        termo = termo.toLowerCase();

        for (let linha of linhas) {
            const texto = linha.textContent.toLowerCase();
            linha.style.display = texto.includes(termo) ? '' : 'none';
        }
    }

    mostrarLoading(mostrar) {
        const loading = document.getElementById('loadingAgendamentos');
        const tabela = document.getElementById('tabela-agendamentos');

        if (mostrar) {
            loading.style.display = 'block';
            tabela.style.display = 'none';
        } else {
            loading.style.display = 'none';
            tabela.style.display = 'table';
        }
    }

    mostrarMensagem(mensagem) {
        document.getElementById('mensagemConfirmacao').textContent = mensagem;
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
        modal.show();
    }

    mostrarErro(mensagem) {
        alert(`Erro: ${mensagem}`);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new RecepcaoAgendamentosManager();
});