// URL da API
const API_URL = 'http://localhost:3000';

// Estado do agendamento
const agendamento = {
    unidade: null,
    servico: null,
    duracao: null,
    data: null,
    hora: null,
    terapeuta: null,
    metodoPagamento: null,
    valor: null
};

// Elementos DOM
const etapas = document.querySelectorAll('.etapa');
const progressoEtapas = document.querySelectorAll('.etapa-progresso');

document.addEventListener('DOMContentLoaded', function () {
    // Verifica se o usuario tá logado
    const loggedIn = localStorage.getItem("loggedIn");
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (!loggedIn || loggedIn !== "true" || !token || !usuario) {
        window.location.href = '../Login/login.html';
        return;
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data').min = hoje;
    carregarUnidades();
    configurarEventListeners();
});

// Navegações entre as etapas
function configurarEventListeners() {
    document.getElementById('avancarEtapa1').addEventListener('click', () => avancarEtapa(1));
    document.getElementById('voltarEtapa2').addEventListener('click', () => voltarEtapa(2));
    document.getElementById('avancarEtapa2').addEventListener('click', () => avancarEtapa(2));
    document.getElementById('voltarEtapa3').addEventListener('click', () => voltarEtapa(3));
    document.getElementById('avancarEtapa3').addEventListener('click', () => avancarEtapa(3));
    document.getElementById('voltarEtapa4').addEventListener('click', () => voltarEtapa(4));
    document.getElementById('avancarEtapa4').addEventListener('click', () => avancarEtapa(4));
    document.getElementById('voltarEtapa5').addEventListener('click', () => voltarEtapa(5));
    document.getElementById('avancarEtapa5').addEventListener('click', () => avancarEtapa(5));
    document.getElementById('voltarEtapa6').addEventListener('click', () => voltarEtapa(6));
    document.getElementById('avancarEtapa6').addEventListener('click', () => avancarEtapa(6));
    document.getElementById('voltarEtapa7').addEventListener('click', () => voltarEtapa(7));
    document.getElementById('confirmarAgendamento').addEventListener('click', confirmarAgendamento);
    document.getElementById('data').addEventListener('change', carregarHorariosDisponiveis);
    document.querySelectorAll('#etapa6 .opcao-card').forEach(card => {
        card.addEventListener('click', function () {
            document.querySelectorAll('#etapa6 .opcao-card').forEach(c => c.classList.remove('selecionada'));
            this.classList.add('selecionada');
            agendamento.metodoPagamento = this.getAttribute('data-metodo');
            document.getElementById('avancarEtapa6').disabled = false;
        });
    });
}

function avancarEtapa(etapaAtual) {
    if (!validarEtapa(etapaAtual)) return;
    atualizarProgresso(etapaAtual, true);
    document.getElementById(`etapa${etapaAtual}`).classList.remove('ativa');
    document.getElementById(`etapa${etapaAtual + 1}`).classList.add('ativa');

    if (etapaAtual === 1) {
        carregarServicos();
    } else if (etapaAtual === 2) {
        configurarDuracao();
    } else if (etapaAtual === 4) {
        carregarTerapeutas();
    } else if (etapaAtual === 6) {
        atualizarResumo();
    }
}

function voltarEtapa(etapaAtual) {
    atualizarProgresso(etapaAtual - 1, false);
    document.getElementById(`etapa${etapaAtual}`).classList.remove('ativa');
    document.getElementById(`etapa${etapaAtual - 1}`).classList.add('ativa');
}

function atualizarProgresso(etapa, avancando) {
    progressoEtapas.forEach((progresso, index) => {
        const etapaNum = index + 1;

        if (avancando) {
            if (etapaNum <= etapa) {
                progresso.classList.add('concluida');
                progresso.classList.remove('ativa');
            } else if (etapaNum === etapa + 1) {
                progresso.classList.add('ativa');
                progresso.classList.remove('concluida');
            } else {
                progresso.classList.remove('ativa', 'concluida');
            }
        } else {
            if (etapaNum < etapa) {
                progresso.classList.add('concluida');
                progresso.classList.remove('ativa');
            } else if (etapaNum === etapa) {
                progresso.classList.add('ativa');
                progresso.classList.remove('concluida');
            } else {
                progresso.classList.remove('ativa', 'concluida');
            }
        }
    });
}

function validarEtapa(etapa) {
    switch (etapa) {
        case 1:
            return agendamento.unidade !== null;
        case 2:
            return agendamento.servico !== null;
        case 3:
            return agendamento.duracao !== null && agendamento.valor !== null;
        case 4:
            return agendamento.data !== null && agendamento.hora !== null;
        case 5:
            return agendamento.terapeuta !== null;
        case 6:
            return agendamento.metodoPagamento !== null;
        default:
            return true;
    }
}

// Carregar unidades
async function carregarUnidades() {
    try {
        console.log('Carregando unidades...');
        const response = await fetch(`${API_URL}/unidades`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const unidades = await response.json();
        console.log('Unidades carregadas:', unidades);

        const container = document.getElementById('opcoesUnidades');
        const loading = document.getElementById('loadingUnidades');

        container.innerHTML = '';

        if (unidades.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhuma unidade encontrada.</p>';
        } else {
            unidades.forEach(unidade => {
                const card = document.createElement('div');
                card.className = 'opcao-card';
                card.setAttribute('data-unidade-id', unidade._id);
                card.innerHTML = `
                        <i class="fa-solid fa-map-marker-alt"></i>
                        <h3>${unidade.nome_unidade}</h3>
                        <p>Clique para selecionar esta unidade</p>
                    `;

                card.addEventListener('click', function () {
                    document.querySelectorAll('#opcoesUnidades .opcao-card').forEach(c => c.classList.remove('selecionada'));
                    this.classList.add('selecionada');
                    agendamento.unidade = {
                        id: unidade._id,
                        nome: unidade.nome_unidade
                    };
                    document.getElementById('avancarEtapa1').disabled = false;
                    console.log('Unidade selecionada:', agendamento.unidade);
                });

                container.appendChild(card);
            });
        }

        loading.style.display = 'none';
        container.style.display = 'grid';

    } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        const loading = document.getElementById('loadingUnidades');
        loading.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar unidades: ${error.message}</p>
                <button class="btn btn-primary mt-2" onclick="carregarUnidades()">Tentar Novamente</button>
            `;
    }
}

// Carregar serviços
async function carregarServicos() {
    try {
        console.log('Carregando serviços...');
        const response = await fetch(`${API_URL}/servicos`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const todosServicos = await response.json();
        const servicos = todosServicos.filter(servico =>
            servico.unidade_id === agendamento.unidade.id && servico.ativo !== false
        );

        console.log('Serviços filtrados:', servicos);

        const container = document.getElementById('opcoesServicos');
        const loading = document.getElementById('loadingServicos');

        container.innerHTML = '';

        if (servicos.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhum serviço disponível nesta unidade.</p>';
        } else {
            servicos.forEach(servico => {
                const card = document.createElement('div');
                card.className = 'opcao-card';
                card.setAttribute('data-servico-id', servico._id);
                const menorValor = servico.opcoes_duracao && servico.opcoes_duracao.length > 0
                    ? Math.min(...servico.opcoes_duracao.map(op => op.valor))
                    : 0;

                card.innerHTML = `
                    <i class="fa-solid fa-spa"></i>
                    <h3>${servico.nome_servico}</h3>
                    <p>${servico.descricao || 'Massagem terapêutica'}</p>
                    <p><strong>A partir de R$ ${menorValor.toFixed(2)}</strong></p>
                `;

                card.addEventListener('click', function () {
                    document.querySelectorAll('#opcoesServicos .opcao-card').forEach(c => c.classList.remove('selecionada'));
                    this.classList.add('selecionada');
                    agendamento.servico = {
                        id: servico._id,
                        nome: servico.nome_servico,
                        opcoesDuracao: servico.opcoes_duracao || [],
                        duracaoMinima: servico.duracao_minima || 15,
                        duracaoMaxima: servico.duracao_maxima || 120,
                        descricao: servico.descricao
                    };
                    document.getElementById('avancarEtapa2').disabled = false;
                    console.log('Serviço selecionado:', agendamento.servico);
                });

                container.appendChild(card);
            });
        }

        loading.style.display = 'none';
        container.style.display = 'grid';
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        const loading = document.getElementById('loadingServicos');
        loading.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar serviços: ${error.message}</p>
            <button class="btn btn-primary mt-2" onclick="carregarServicos()">Tentar Novamente</button>
        `;
    }
}

function configurarDuracao() {
    const servico = agendamento.servico;
    const opcoesContainer = document.getElementById('opcoesDuracao');

    document.querySelector('.form-group:has(#duracao)').style.display = 'none';
    opcoesContainer.innerHTML = '';

    if (!servico.opcoesDuracao || servico.opcoesDuracao.length === 0) {
        opcoesContainer.innerHTML = '<p class="text-center">Nenhuma opção de duração disponível para este serviço.</p>';
        return;
    }

    servico.opcoesDuracao.forEach(opcao => {
        const card = document.createElement('div');
        card.className = 'opcao-card opcao-duracao';
        card.innerHTML = `
                <div class="duracao-tempo">${opcao.descricao || opcao.duracao + ' min'}</div>
                <div class="duracao-valor">R$ ${opcao.valor.toFixed(2)}</div>
            `;

        card.addEventListener('click', function () {
            document.querySelectorAll('#opcoesDuracao .opcao-card').forEach(b => b.classList.remove('selecionada'));
            this.classList.add('selecionada');
            agendamento.duracao = opcao.duracao;
            agendamento.valor = opcao.valor;
            document.getElementById('avancarEtapa3').disabled = false;
            console.log('Duração selecionada:', opcao.duracao + 'min', 'Valor: R$' + opcao.valor);
        });
        opcoesContainer.appendChild(card);
    });

    if (servico.opcoesDuracao.length > 0) {
        opcoesContainer.querySelector('.opcao-card').click();
    }
}

// Carregar horários disponíveis
async function carregarHorariosDisponiveis() {
    const data = document.getElementById('data').value;
    if (!data) return;

    const loading = document.getElementById('loadingHorarios');
    const container = document.getElementById('opcoesHorarios');

    loading.style.display = 'block';
    container.style.display = 'none';
    container.innerHTML = '';

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Horários de exemplo (ainda vamo ver se a gnt usa horarios oficiais da rokuzen ou fictícios msm)
        const horarios = [
            '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
        ];

        container.innerHTML = '';
        horarios.forEach(horario => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'horario-btn';
            btn.textContent = horario;
            btn.addEventListener('click', function () {
                document.querySelectorAll('#opcoesHorarios .horario-btn').forEach(b => b.classList.remove('selecionado'));
                this.classList.add('selecionado');
                agendamento.data = data;
                agendamento.hora = horario;
                document.getElementById('avancarEtapa4').disabled = false;
            });
            container.appendChild(btn);
        });

        loading.style.display = 'none';
        container.style.display = 'grid';

    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        loading.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar horários</p>
            `;
    }
}

// Carregar terapeutas
async function carregarTerapeutas() {
    try {
        console.log('Carregando terapeutas...');
        const response = await fetch(`${API_URL}/colaboradores`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const todosColaboradores = await response.json();
        const terapeutas = todosColaboradores.filter(colaborador =>
            colaborador.unidade_id === agendamento.unidade.id && 
            colaborador.ativo !== false &&
            colaborador.tipo_colaborador === 4
        );

        console.log('Terapeutas filtrados:', terapeutas);

        const container = document.getElementById('opcoesTerapeutas');
        const loading = document.getElementById('loadingTerapeutas');

        container.innerHTML = '';

        if (terapeutas.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhum terapeuta disponível nesta unidade.</p>';
        } else {
            terapeutas.forEach(terapeuta => {
                const card = document.createElement('div');
                card.className = 'opcao-card';
                card.setAttribute('data-terapeuta-id', terapeuta._id);
                
                card.innerHTML = `
                    <i class="fa-solid fa-user-md"></i>
                    <h3>${terapeuta.nome_colaborador}</h3>
                    <p>${terapeuta.especialidades?.join(', ') || 'Massoterapeuta'}</p>
                `;

                card.addEventListener('click', function () {
                    document.querySelectorAll('#opcoesTerapeutas .opcao-card').forEach(c => c.classList.remove('selecionada'));
                    this.classList.add('selecionada');
                    agendamento.terapeuta = {
                        id: terapeuta._id,
                        nome: terapeuta.nome_colaborador
                    };
                    document.getElementById('avancarEtapa5').disabled = false;
                    console.log('Terapeuta selecionado:', agendamento.terapeuta);
                });

                container.appendChild(card);
            });
        }

        loading.style.display = 'none';
        container.style.display = 'grid';
    } catch (error) {
        console.error('Erro ao carregar terapeutas:', error);
        const loading = document.getElementById('loadingTerapeutas');
        loading.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar terapeutas: ${error.message}</p>
            <button class="btn btn-primary mt-2" onclick="carregarTerapeutas()">Tentar Novamente</button>
        `;
    }
}

function atualizarResumo() {
    document.getElementById('resumoUnidade').textContent = agendamento.unidade?.nome || '-';
    document.getElementById('resumoServico').textContent = agendamento.servico?.nome || '-';
    document.getElementById('resumoDuracao').textContent = `${agendamento.duracao} minutos` || '-';
    document.getElementById('resumoDataHora').textContent = `${agendamento.data} às ${agendamento.hora}` || '-';
    document.getElementById('resumoTerapeuta').textContent = agendamento.terapeuta?.nome || '-';

    // Métodos de pagamento (apenas simulação pq não funciona de verdade)
    const metodos = {
        'cartao': 'Cartão de Crédito',
        'debito': 'Cartão de Débito',
        'pix': 'PIX',
        'dinheiro': 'Dinheiro'
    };
    document.getElementById('resumoPagamento').textContent = metodos[agendamento.metodoPagamento] || '-';
    document.getElementById('resumoValor').textContent = `R$ ${agendamento.valor?.toFixed(2) || '0,00'}`;
}

// Confirmar agendamento
async function confirmarAgendamento() {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = '../Login/login.html';
            return;
        }

        const dadosAgendamento = {
            terapeuta_id: agendamento.terapeuta.id,
            unidade_id: agendamento.unidade.id,
            servico_id: agendamento.servico.id,
            inicio_sessao: new Date(`${agendamento.data}T${agendamento.hora}`).toISOString(),
            fim_sessao: new Date(new Date(`${agendamento.data}T${agendamento.hora}`).getTime() + agendamento.duracao * 60000).toISOString(),
            observacoes: `Agendamento online - ${agendamento.servico.nome} - ${agendamento.duracao}min`,
            valor: agendamento.valor
        };

        const response = await fetch(`${API_URL}/agendamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosAgendamento)
        });

        if (response.ok) {
            alert('Agendamento confirmado!');
            window.location.href = '../index.html';
        } else {
            const erro = await response.json();
            throw new Error(erro.erro || 'Erro no agendamento');
        }

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro: ' + error.message);
    }
}



