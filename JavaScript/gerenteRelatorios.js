class RelatoriosViewManager {
    constructor() {
        this.relatorios = [];
        this.relatoriosFiltrados = [];

        this.init();
    }

    async init() {
        await this.verificarAutenticacao();
        await this.carregarRelatorios();
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

    async carregarRelatorios() {
        try {
            const token = localStorage.getItem('token');
            const loading = document.getElementById('loadingRelatorios');
            const lista = document.getElementById('listaRelatorios');
            const semDados = document.getElementById('semRelatorios');

            loading.style.display = 'block';
            lista.style.display = 'none';
            semDados.style.display = 'none';

            const response = await fetch('http://localhost:3000/relatorios', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar relatórios');
            }

            this.relatorios = await response.json();
            this.relatoriosFiltrados = [...this.relatorios];
            this.exibirRelatorios();

        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            this.mostrarErro('Erro ao carregar relatórios');
        }
    }

    exibirRelatorios() {
        const loading = document.getElementById('loadingRelatorios');
        const lista = document.getElementById('listaRelatorios');
        const semDados = document.getElementById('semRelatorios');

        loading.style.display = 'none';

        if (this.relatoriosFiltrados.length === 0) {
            lista.style.display = 'none';
            semDados.style.display = 'block';
            return;
        }

        lista.style.display = 'block';
        semDados.style.display = 'none';

        // Ordenar por data mais recente primeiro
        const relatoriosOrdenados = this.relatoriosFiltrados.sort((a, b) =>
            new Date(b.inicio_atendimento) - new Date(a.inicio_atendimento)
        );

        lista.innerHTML = relatoriosOrdenados.map(relatorio => `
            <div class="relatorio-item card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <strong>Data</strong>
                            <p>${new Date(relatorio.inicio_atendimento).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div class="col-md-3">
                            <strong>Cliente</strong>
                            <p>${relatorio.cliente_id?.nome || 'N/A'}</p>
                        </div>
                        <div class="col-md-3">
                            <strong>Terapeuta</strong>
                            <p>${relatorio.colaborador_id?.nome_colaborador || 'N/A'}</p>
                        </div>
                        <div class="col-md-2">
                            <strong>Satisfação</strong>
                            <p>
                                <span class="badge ${this.getBadgeSatisfacao(relatorio.satisfacao_cliente)}">
                                    ${relatorio.satisfacao_cliente ? '★'.repeat(relatorio.satisfacao_cliente) : 'N/A'}
                                </span>
                            </p>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-sm btn-outline-primary btn-detalhes" data-id="${relatorio._id}">
                                <i class="fa-solid fa-eye"></i> Ver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Adicionar eventos aos botões de detalhes
        document.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const relatorioId = e.target.closest('.btn-detalhes').dataset.id;
                this.mostrarDetalhes(relatorioId);
            });
        });
    }

    getBadgeSatisfacao(satisfacao) {
        if (!satisfacao) return 'bg-secondary';
        if (satisfacao >= 4) return 'bg-success';
        if (satisfacao >= 3) return 'bg-warning';
        return 'bg-danger';
    }

    async mostrarDetalhes(relatorioId) {
        try {
            const token = localStorage.getItem('token');
            const relatorio = this.relatoriosFiltrados.find(r => r._id === relatorioId);

            if (!relatorio) return;

            const detalhes = document.getElementById('detalhesRelatorio');
            detalhes.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Informações do Cliente</h6>
                        <p><strong>Nome:</strong> ${relatorio.cliente_id?.nome || 'N/A'}</p>
                        <p><strong>Email:</strong> ${relatorio.cliente_id?.email || 'N/A'}</p>
                        <p><strong>Telefone:</strong> ${relatorio.cliente_id?.telefone || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Informações do Terapeuta</h6>
                        <p><strong>Nome:</strong> ${relatorio.colaborador_id?.nome_colaborador || 'N/A'}</p>
                        <p><strong>Especialidades:</strong> ${(relatorio.colaborador_id?.especialidades || []).join(', ') || 'N/A'}</p>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h6>Detalhes do Atendimento</h6>
                        <p><strong>Serviço:</strong> ${relatorio.servico_id?.nome_servico || 'N/A'}</p>
                        <p><strong>Unidade:</strong> ${relatorio.unidade_id?.nome_unidade || 'N/A'}</p>
                        <p><strong>Data/Hora:</strong> ${new Date(relatorio.inicio_atendimento).toLocaleString('pt-BR')}</p>
                        <p><strong>Duração:</strong> ${relatorio.duracao_real_minutos || 0} minutos</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Informações Financeiras</h6>
                        <p><strong>Valor:</strong> R$ ${(relatorio.valor_servico || 0).toFixed(2)}</p>
                        <p><strong>Tipo Pagamento:</strong> ${relatorio.tipo_pagamento || 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="badge ${relatorio.status_pagamento === 'pago' ? 'bg-success' : 'bg-warning'}">${relatorio.status_pagamento || 'N/A'}</span></p>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <h6>Observações do Atendimento</h6>
                        <div class="border p-3 bg-light rounded">
                            ${relatorio.observacao_cliente || 'Nenhuma observação registrada.'}
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h6>Avaliação</h6>
                        <p><strong>Satisfação do Cliente:</strong> 
                            <span class="badge ${this.getBadgeSatisfacao(relatorio.satisfacao_cliente)}">
                                ${relatorio.satisfacao_cliente ? '★'.repeat(relatorio.satisfacao_cliente) + ` (${relatorio.satisfacao_cliente}/5)` : 'N/A'}
                            </span>
                        </p>
                    </div>
                    <div class="col-md-6">
                        <h6>Informações Adicionais</h6>
                        <p><strong>Agendado Online:</strong> ${relatorio.foi_marcado_online ? 'Sim' : 'Não'}</p>
                        <p><strong>Criado em:</strong> ${new Date(relatorio.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                </div>
            `;

            const modal = new bootstrap.Modal(document.getElementById('modalDetalhes'));
            modal.show();

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            this.mostrarErro('Erro ao carregar detalhes do relatório');
        }
    }

    pesquisarRelatorios() {
        const termo = document.getElementById('barraPesquisa').value.toLowerCase().trim();

        if (!termo) {
            this.relatoriosFiltrados = [...this.relatorios];
        } else {
            this.relatoriosFiltrados = this.relatorios.filter(relatorio =>
                (relatorio.cliente_id?.nome?.toLowerCase().includes(termo)) ||
                (relatorio.colaborador_id?.nome_colaborador?.toLowerCase().includes(termo))
            );
        }

        this.exibirRelatorios();
    }

    configurarEventos() {
        document.getElementById('btnPesquisar').addEventListener('click', () => {
            this.pesquisarRelatorios();
        });

        document.getElementById('barraPesquisa').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.pesquisarRelatorios();
            }
        });

        // Pesquisa em tempo real (opcional)
        document.getElementById('barraPesquisa').addEventListener('input', (e) => {
            clearTimeout(this.pesquisaTimeout);
            this.pesquisaTimeout = setTimeout(() => {
                this.pesquisarRelatorios();
            }, 300);
        });
    }

    mostrarErro(mensagem) {
        alert(`Erro: ${mensagem}`);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new RelatoriosViewManager();
});