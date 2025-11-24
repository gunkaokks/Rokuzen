class RelatoriosManager {
    constructor() {
        this.agendamentos = [];
        this.agendamentoSelecionado = null;
        this.terapeutaId = null;

        this.init();
    }

    async init() {
        await this.carregarTerapeutaId();
        await this.carregarAgendamentos();
        this.configurarEventos();
    }

    async carregarTerapeutaId() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Token não encontrado');
                window.location.href = '../Login/login.html';
                return;
            }

            // Decodificar o token para obter o ID do terapeuta
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.terapeutaId = payload.id || payload.userId;

        } catch (error) {
            console.error('Erro ao carregar ID do terapeuta:', error);
            window.location.href = '../Login/login.html';
        }
    }

    async carregarAgendamentos() {
        try {
            const token = localStorage.getItem('token');
            if (!token || !this.terapeutaId) {
                console.error('Token ou ID do terapeuta não encontrado');
                return;
            }

            // Buscar agendamentos do terapeuta
            const hoje = new Date().toISOString().split('T')[0];
            const response = await fetch(`http://localhost:3000/agendamentos/terapeuta/${this.terapeutaId}?data=${hoje}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar agendamentos');
            }

            this.agendamentos = await response.json();
            this.exibirAgendamentos();

        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.mostrarErro('Erro ao carregar agendamentos');
        }
    }

    exibirAgendamentos() {
        const listaAgendamentos = document.getElementById('listaAgendamentos');
        const loading = document.getElementById('loadingAgendamentos');

        loading.style.display = 'none';
        listaAgendamentos.style.display = 'block';

        if (this.agendamentos.length === 0) {
            listaAgendamentos.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-calendar-times fa-2x mb-3"></i>
                    <p>Nenhum agendamento encontrado para hoje</p>
                </div>
            `;
            return;
        }

        listaAgendamentos.innerHTML = this.agendamentos.map(agendamento => `
            <div class="agendamento-item ${this.agendamentoSelecionado?._id === agendamento._id ? 'selecionado' : ''}" 
                 data-id="${agendamento._id}">
                <div class="agendamento-info">
                    <strong>${agendamento.usuario_id?.nome || 'Cliente não encontrado'}</strong>
                    <div class="text-muted small">
                        ${agendamento.servico_id?.nome_servico || 'Serviço não especificado'}
                    </div>
                    <div class="text-muted small">
                        ${new Date(agendamento.inicio_sessao).toLocaleString('pt-BR')}
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-primary btn-selecionar">
                    Selecionar
                </button>
            </div>
        `).join('');

        // Adicionar eventos aos botões de seleção
        document.querySelectorAll('.btn-selecionar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const agendamentoId = e.target.closest('.agendamento-item').dataset.id;
                this.selecionarAgendamento(agendamentoId);
            });
        });
    }

    selecionarAgendamento(agendamentoId) {
        this.agendamentoSelecionado = this.agendamentos.find(a => a._id === agendamentoId);

        // Atualizar visualização
        document.querySelectorAll('.agendamento-item').forEach(item => {
            item.classList.remove('selecionado');
        });
        document.querySelector(`[data-id="${agendamentoId}"]`).classList.add('selecionado');

        // Preencher formulário
        this.preencherFormulario();
    }

    preencherFormulario() {
        const form = document.getElementById('formRelatorio');
        const formVazio = document.getElementById('formVazio');

        formVazio.style.display = 'none';
        form.style.display = 'block';

        // Preencher informações do cliente
        document.getElementById('clienteNome').value = this.agendamentoSelecionado.usuario_id?.nome || '';
        document.getElementById('clienteEmail').value = this.agendamentoSelecionado.usuario_id?.email || '';

        // Preencher informações do atendimento
        document.getElementById('servicoNome').value = this.agendamentoSelecionado.servico_id?.nome_servico || '';
        document.getElementById('unidadeNome').value = this.agendamentoSelecionado.unidade_id?.nome_unidade || '';
        document.getElementById('dataAtendimento').value = new Date(this.agendamentoSelecionado.inicio_sessao).toLocaleString('pt-BR');

        // Preencher informações do terapeuta
        document.getElementById('terapeutaNome').value = this.agendamentoSelecionado.terapeuta_id?.nome_colaborador || '';
        document.getElementById('terapeutaEspecialidades').value =
            (this.agendamentoSelecionado.terapeuta_id?.especialidades || []).join(', ') || 'Não especificado';

        // Limpar campos editáveis
        document.getElementById('observacoesAtendimento').value = '';
        document.getElementById('duracaoReal').value = '';
        document.getElementById('satisfacaoCliente').value = '';
    }

    configurarEventos() {
        document.getElementById('formRelatorio').addEventListener('submit', (e) => {
            e.preventDefault();
            this.enviarRelatorio();
        });

        document.getElementById('btnSalvarRascunho').addEventListener('click', () => {
            this.salvarRascunho();
        });
    }

    async enviarRelatorio() {
        try {
            if (!this.validarFormulario()) {
                return;
            }

            const token = localStorage.getItem('token');
            const relatorioData = this.coletarDadosRelatorio();

            // USAR A NOVA ROTA /relatorios EM VEZ DE /atendimentos
            const response = await fetch('http://localhost:3000/relatorios', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(relatorioData)
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar relatório');
            }

            const resultado = await response.json();
            this.mostrarConfirmacao('Relatório enviado com sucesso!');
            console.log('Relatório salvo:', resultado);

            // Limpar formulário após envio
            this.limparFormulario();

        } catch (error) {
            console.error('Erro ao enviar relatório:', error);
            this.mostrarErro('Erro ao enviar relatório: ' + error.message);
        }
    }

    async salvarRascunho() {
        try {
            if (!this.validarFormulario()) {
                return;
            }

            const relatorioData = this.coletarDadosRelatorio();

            // Salvar no localStorage como rascunho
            const rascunhos = JSON.parse(localStorage.getItem('rascunhosRelatorios') || '[]');
            rascunhos.push({
                ...relatorioData,
                agendamentoId: this.agendamentoSelecionado._id,
                salvoEm: new Date().toISOString(),
                tipo: 'rascunho'
            });
            localStorage.setItem('rascunhosRelatorios', JSON.stringify(rascunhos));

            this.mostrarConfirmacao('Rascunho salvo com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar rascunho:', error);
            this.mostrarErro('Erro ao salvar rascunho');
        }
    }

    coletarDadosRelatorio() {
        const inicioAtendimento = new Date(this.agendamentoSelecionado.inicio_sessao);
        const duracaoMinutos = parseInt(document.getElementById('duracaoReal').value) || 60;
        const fimAtendimento = new Date(inicioAtendimento.getTime() + duracaoMinutos * 60000);

        return {
            unidade_id: this.agendamentoSelecionado.unidade_id?._id,
            cliente_id: this.agendamentoSelecionado.usuario_id?._id,
            servico_id: this.agendamentoSelecionado.servico_id?._id,
            colaborador_id: this.agendamentoSelecionado.terapeuta_id?._id,
            inicio_atendimento: inicioAtendimento,
            fim_atendimento: fimAtendimento,
            valor_servico: this.agendamentoSelecionado.valor || this.agendamentoSelecionado.servico_id?.valor_base || 0,
            tipo_pagamento: 'cartao', // Valor padrão, pode ser ajustado
            status_pagamento: 'pago',
            observacao_cliente: document.getElementById('observacoesAtendimento').value,
            foi_marcado_online: true,
            duracao_real_minutos: duracaoMinutos,
            satisfacao_cliente: parseInt(document.getElementById('satisfacaoCliente').value)
        };
    }

    validarFormulario() {
        const observacoes = document.getElementById('observacoesAtendimento').value.trim();
        const duracao = document.getElementById('duracaoReal').value;
        const satisfacao = document.getElementById('satisfacaoCliente').value;

        if (!observacoes) {
            this.mostrarErro('Por favor, preencha as observações do atendimento');
            return false;
        }

        if (!duracao || duracao < 1) {
            this.mostrarErro('Por favor, informe a duração real do atendimento');
            return false;
        }

        if (!satisfacao) {
            this.mostrarErro('Por favor, avalie a satisfação do cliente');
            return false;
        }

        return true;
    }

    limparFormulario() {
        document.getElementById('observacoesAtendimento').value = '';
        document.getElementById('duracaoReal').value = '';
        document.getElementById('satisfacaoCliente').value = '';

        const form = document.getElementById('formRelatorio');
        const formVazio = document.getElementById('formVazio');
        form.style.display = 'none';
        formVazio.style.display = 'block';

        // Desselecionar agendamento
        this.agendamentoSelecionado = null;
        document.querySelectorAll('.agendamento-item').forEach(item => {
            item.classList.remove('selecionado');
        });
    }

    mostrarConfirmacao(mensagem) {
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
    new RelatoriosManager();
});