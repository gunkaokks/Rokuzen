const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Unidade = require('./ModeloRelacional/unidades')
const Colaborador = require('./ModeloRelacional/colaboradores')
const Servico = require('./ModeloRelacional/servicos')
const Agendamento = require('./ModeloRelacional/agendamento')
const Escala = require('./ModeloRelacional/escalas')
const PontoEletronico = require('./ModeloRelacional/ponto_eletronico')
const Usuario = require('./ModeloRelacional/usuarios.js')

const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

const stringConexaoBD = process.env.CONEXAO_BD

async function conectarAoMongoDB() {
  await mongoose.connect(stringConexaoBD)
  app.listen(3000, () => console.log("servidor up and running"));
}

// Middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, "chave-secreta");
    req.usuario = {
      email: decoded.email,
      userId: decoded.userId,
      tipo: decoded.tipo
    };

    next();
  } catch (error) {
    res.status(401).json({ erro: 'Token inválido' });
    fazerLogout();
    window.location.href = '../Login/login.html';
  }
};

// autenticar token
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso requerido' });
  }

  jwt.verify(token, "chave-secreta", (err, usuario) => {
    if (err) {
      fazerLogout();
      window.location.href = '/Login/login.html';
      return res.status(403).json({ erro: 'Token inválido' });
    }
    req.usuario = usuario;
    next();
  });
}

const sessoesAtivas = {}

app.get('/', (req, res) => {
  res.json({ mensagem: 'Sistema de atendimentos + autenticação funcionando!' })
})

// Cadastro
app.post('/signup', async (req, res) => {
  try {
    const nome = req.body.nome
    const email = req.body.email
    const senha = req.body.senha
    const telefone = req.body.telefone
    const tipo = req.body.tipo || 'usuario'

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ erro: 'Nome é obrigatório' })
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({ erro: 'Email é obrigatório' })
    }

    if (!senha || senha.trim() === '') {
      return res.status(400).json({ erro: 'Senha é obrigatória' })
    }

    if (!telefone || telefone.trim() === '') {
      return res.status(400).json({ erro: 'Telefone é obrigatório' })
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const usuario = new Usuario({
      nome: nome,
      email: email,
      senha: senhaCriptografada,
      telefone: telefone,
      tipo: tipo
    })

    const respostaMongo = await usuario.save()

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso!',
      usuario: {
        nome: nome,
        email: email,
        telefone: telefone,
        tipo: tipo
      }
    })
  }
  catch (exception) {
    if (exception.code === 11000) {
      return res.status(409).json({ erro: 'Email já existe' })
    }

    res.status(500).json({ erro: 'Erro interno: ' + exception.message })
  }
})

// Login
app.post('/login', async (req, res) => {
  try {
    const email = req.body.email
    const senha = req.body.senha

    const usuario = await Usuario.findOne({ email: email })

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado' })
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' })
    }

    const tokenPayload = {
      userId: usuario._id.toString(),
      email: usuario.email,
      nome: usuario.nome,
      tipo: usuario.tipo
    };

    const token = jwt.sign(
      tokenPayload,
      "chave-secreta",
      { expiresIn: "168h" }
    )

    const sessaoId = Math.random().toString(36).substring(2)
    sessoesAtivas[sessaoId] = {
      usuarioId: usuario._id,
      email: usuario.email,
      tipo: usuario.tipo
    }

    res.json({
      mensagem: 'Login realizado com sucesso!',
      sessaoId: sessaoId,
      token: token,
      usuario: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        tipo: usuario.tipo
      }
    })

  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor' })
  }
})

// Editar usuário (sómente gerente)
app.put('/usuarios/:id', authMiddleware, async (req, res) => {
  try {
    // Verificar se usuário tem permissão (master, gerente)
    const usuarioAutenticado = await Usuario.findById(req.usuario.userId);
    if (!['master', 'gerente'].includes(usuarioAutenticado.tipo)) {
      return res.status(403).json({ erro: 'Sem permissão para editar usuários' });
    }

    const { nome, email, telefone, tipo } = req.body;
    const usuarioId = req.params.id;

    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      {
        nome: nome,
        email: email,
        telefone: telefone,
        tipo: tipo
      },
      { new: true, runValidators: true }
    ).select('-senha');

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({
      mensagem: 'Usuário atualizado com sucesso!',
      usuario: usuario
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ erro: 'Email ou telefone já existe' });
    }
    res.status(400).json({ erro: error.message });
  }
});

// Editar perfil
app.put('/meu-perfil', authMiddleware, async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!req.usuario.userId) {
      return res.status(401).json({ erro: 'ID do usuário não encontrado no token' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario.userId,
      {
        nome: nome,
        email: email,
        telefone: telefone
      },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({
      mensagem: 'Perfil atualizado com sucesso!',
      usuario: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        tipo: usuario.tipo
      }
    });

  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// Pegar perfil MongoDB
app.get('/meu-perfil', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.userId);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({
      usuario: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        tipo: usuario.tipo
      }
    });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// Listar perfil do colaborador
app.get('/meu-perfil-colaborador', authMiddleware, async (req, res) => {
  try {
    const colaborador = await Colaborador.findById(req.usuario.userId);

    if (!colaborador) {
      return res.status(404).json({ erro: 'Colaborador não encontrado' });
    }

    res.json({
      colaborador: {
        _id: colaborador._id,
        nome: colaborador.nome_colaborador,
        email: colaborador.email,
        telefone: colaborador.telefone,
        tipo: colaborador.tipo_colaborador,
        especialidades: colaborador.especialidades,
        unidade_id: colaborador.unidade_id
      }
    });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// Editar perfil do colaborador
app.put('/meu-perfil-colaborador', authMiddleware, async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!req.usuario.userId) {
      return res.status(401).json({ erro: 'ID do colaborador não encontrado no token' });
    }

    const colaborador = await Colaborador.findByIdAndUpdate(
      req.usuario.userId,
      {
        nome_colaborador: nome,
        email: email,
        telefone: telefone
      },
      { new: true, runValidators: true }
    );

    if (!colaborador) {
      return res.status(404).json({ erro: 'Colaborador não encontrado' });
    }

    res.json({
      mensagem: 'Perfil atualizado com sucesso!',
      colaborador: {
        _id: colaborador._id,
        nome: colaborador.nome_colaborador,
        email: colaborador.email,
        telefone: colaborador.telefone,
        tipo: colaborador.tipo_colaborador,
        especialidades: colaborador.especialidades
      }
    });

  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// Autenticação
app.get('/debug-auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido!',
    usuario: req.usuario,
    timestamp: new Date().toISOString()
  });
});

// Criar unidade
app.post('/unidades', async (req, res) => {
  try {
    const unidade = new Unidade({
      nome_unidade: req.body.nome_unidade
    })
    await unidade.save()
    res.status(201).json(unidade)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar unidades
app.get('/unidades', async (req, res) => {
  try {
    const unidades = await Unidade.find()
    res.json(unidades)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// Buscar serviços por unidade
app.get('/servicos/unidade/:unidadeId', async (req, res) => {
  try {
    const servicos = await Servico.find({
      unidade_id: req.params.unidadeId,
      ativo: true
    });
    res.json(servicos);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Listar usuários
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select('-senha')
      .sort({ data_criacao: -1 });
    res.json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Criar colaborador
app.post('/colaboradores', async (req, res) => {
  try {
    const { nome, email, senha, tipo, especialidades, ...outrosDados } = req.body;

    // senha padrão 123456
    const senhaFinal = senha || "123456";
    const senhaCriptografada = await bcrypt.hash(senhaFinal, 10);

    const colaborador = new Colaborador({
      nome,
      email,
      senha: senhaCriptografada,
      tipo,
      especialidades,
      ...outrosDados
    });

    await colaborador.save();
    res.status(201).json(colaborador);
  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

// Listar colaboradores
app.get('/colaboradores', async (req, res) => {
  try {
    const colaboradores = await Colaborador.find()
      .populate('unidade_id', 'nome_unidade');
    res.json(colaboradores);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Login do colaborador
app.post('/colaboradores/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const colaborador = await Colaborador.findOne({ email });

    if (!colaborador) {
      return res.status(401).json({ erro: 'Colaborador não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, colaborador.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }

    const token = jwt.sign({
      id: colaborador._id,
      tipo_colaborador: colaborador.tipo_colaborador,
      email: colaborador.email
    }, 'chave-secreta', { expiresIn: '168h' });

    res.json({
      mensagem: 'Login realizado com sucesso',
      token: token,
      sessaoId: 'sessao_' + Date.now(),
      usuario: {
        id: colaborador._id,
        nome: colaborador.nome_colaborador,
        email: colaborador.email,
        tipo: colaborador.tipo_colaborador
      }
    });

  } catch (erro) {
    console.error('Erro no login:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor: ' + erro.message });
  }
});

app.get('/colaboradores/:id', authMiddleware, async (req, res) => {
    try {
        const colaborador = await Colaborador.findById(req.params.id);
        
        if (!colaborador) {
            return res.status(404).json({ erro: 'Colaborador não encontrado' });
        }

        res.json({
            _id: colaborador._id,
            nome: colaborador.nome_colaborador,
            email: colaborador.email,
            telefone: colaborador.telefone,
            tipo: colaborador.tipo_colaborador,
            especialidades: colaborador.especialidades,
            unidade_id: colaborador.unidade_id
        });
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Editar colaborador
app.put('/colaboradores/:id', authMiddleware, async (req, res) => {
    try {
        const { nome, email, telefone } = req.body;
        const colaboradorId = req.params.id;

        const colaborador = await Colaborador.findByIdAndUpdate(
            colaboradorId,
            {
                nome_colaborador: nome,
                email: email,
                telefone: telefone
            },
            { new: true, runValidators: true }
        );

        if (!colaborador) {
            return res.status(404).json({ erro: 'Colaborador não encontrado' });
        }

        res.json({
            mensagem: 'Colaborador atualizado com sucesso!',
            colaborador: {
                _id: colaborador._id,
                nome: colaborador.nome_colaborador,
                email: colaborador.email,
                telefone: colaborador.telefone,
                tipo: colaborador.tipo_colaborador
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ erro: 'Email já existe' });
        }
        res.status(400).json({ erro: error.message });
    }
});

// Criar serviço
app.post('/servicos', async (req, res) => {
  try {
    const servico = new Servico(req.body)
    await servico.save()
    res.status(201).json(servico)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar serviços
app.get('/servicos', async (req, res) => {
  try {
    const servicos = await Servico.find()
    res.json(servicos)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// Criar atendimento
app.post('/atendimentos', async (req, res) => {
  try {
    const atendimento = new Atendimento(req.body)
    await atendimento.save()
    res.status(201).json(atendimento)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar atendimentos
app.get('/atendimentos', async (req, res) => {
  try {
    const atendimentos = await Atendimento.find()
    res.json(atendimentos)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// Criar escala
app.post('/escalas', async (req, res) => {
  try {
    const escala = new Escala(req.body)
    await escala.save()
    res.status(201).json(escala)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar escalas
app.get('/escalas', async (req, res) => {
  try {
    const escalas = await Escala.find()
    res.json(escalas)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// Criar ponto
app.post('/pontos', async (req, res) => {
  try {
    const ponto = new PontoEletronico(req.body)
    await ponto.save()
    res.status(201).json(ponto)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar pontos
app.get('/pontos', async (req, res) => {
  try {
    const pontos = await PontoEletronico.find()
    res.json(pontos)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// Criar agendamento
app.post('/agendamentos', autenticarToken, async (req, res) => {
  try {
    const usuarioEmail = req.usuario.email;
    const usuario = await Usuario.findOne({ email: usuarioEmail });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const dadosAgendamento = {
      usuario_id: usuario._id,
      terapeuta_id: req.body.terapeuta_id,
      unidade_id: req.body.unidade_id,
      servico_id: req.body.servico_id,
      data_agendamento: new Date(),
      inicio_sessao: new Date(req.body.inicio_sessao),
      fim_sessao: new Date(req.body.fim_sessao),
      observacoes: req.body.observacoes,
      valor: req.body.valor,
      criado_por: usuario._id
    };

    const conflito = await Agendamento.verificarConflito(
      dadosAgendamento.terapeuta_id, dadosAgendamento.inicio_sessao, dadosAgendamento.fim_sessao
    );

    if (conflito) {
      return res.status(409).json({
        erro: 'Horário indisponível'
      });
    }

    const agendamento = new Agendamento(dadosAgendamento);
    await agendamento.save();

    res.status(201).json({
      mensagem: 'Agendamento criado com sucesso!',
      agendamento
    });

  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

// Listar agendamentos
app.get('/agendamentos', async (req, res) => {
  try {
    const agendamentos = await Agendamento.find()
      .populate('usuario_id', 'nome email telefone')
      .populate('terapeuta_id', 'nome_colaborador especialidades')
      .populate('unidade_id', 'nome_unidade')
      .populate('servico_id', 'nome_servico duracao_minutos valor_base')
      .populate('criado_por', 'nome tipo')
      .sort({ inicio_sessao: 1 });

    res.json(agendamentos);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Cancelar agendamentos
app.patch('/agendamentos/:id/cancelar', autenticarToken, async (req, res) => {
  try {
    const agendamento = await Agendamento.findById(req.params.id)
      .populate('usuario_id', 'nome email');

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }

    const usuario = await Usuario.findOne({ email: req.usuario.email });
    const isDono = agendamento.usuario_id._id.toString() === usuario._id.toString();
    const isAdmin = usuario.tipo === 'admin';

    if (!isDono && !isAdmin) {
      return res.status(403).json({ erro: 'Você não tem permissão para cancelar este agendamento' });
    }

    if (agendamento.status === 'cancelado') {
      return res.status(400).json({ erro: 'Agendamento já está cancelado' });
    }

    // Verificar se já passou do horário
    if (agendamento.inicio_sessao < new Date()) {
      return res.status(400).json({ erro: 'Não é possível cancelar um agendamento que já passou' });
    }

    const horasAntecedencia = 1;
    const agora = new Date();
    const diferencaMs = agendamento.inicio_sessao - agora;
    const diferencaMinutos = diferencaMs / (1000 * 60);

    if (diferencaMinutos < (horasAntecedencia * 60)) {
      const minutosRestantes = Math.floor(diferencaMinutos);
      if (minutosRestantes <= 0) {
        return res.status(400).json({
          erro: 'Não é possível cancelar um agendamento que já começou ou está muito próximo do horário'
        });
      }
      return res.status(400).json({
        erro: `Cancelamento permitido apenas com mais de ${horasAntecedencia} hora de antecedência. Faltam apenas ${minutosRestantes} minutos para o agendamento.`
      });
    }

    agendamento.status = 'cancelado';
    agendamento.cancelado_em = new Date();
    agendamento.cancelado_por = usuario._id;

    await agendamento.save();

    res.json({
      mensagem: 'Agendamento cancelado com sucesso!',
      agendamento: {
        _id: agendamento._id,
        status: agendamento.status,
        cancelado_em: agendamento.cancelado_em
      }
    });

  } catch (erro) {
    console.error('Erro ao cancelar agendamento:', erro);
    res.status(400).json({ erro: erro.message });
  }
});

// Listar terapeuta
app.get('/agendamentos/terapeuta/:terapeutaId', async (req, res) => {
  try {
    const { terapeutaId } = req.params;
    const { data } = req.query;

    // Construir query
    const query = {
      terapeuta_id: terapeutaId,
      status: 'agendado'
    };

    if (data) {
      const dataInicio = new Date(`${data}T00:00:00`);
      const dataFim = new Date(`${data}T23:59:59`);

      query.inicio_sessao = {
        $gte: dataInicio,
        $lte: dataFim
      };
    }

    const agendamentos = await Agendamento.find(query)
      .populate('usuario_id', 'nome email')
      .populate('servico_id', 'nome_servico')
      .populate('unidade_id', 'nome_unidade')
      .populate('terapeuta_id', 'nome_colaborador')
      .sort({ inicio_sessao: 1 });

    res.json(agendamentos);

  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.listen(3000, () => {
  try {
    conectarAoMongoDB()
  }
  catch (e) {
  }
})

app.put('/alterar-senha', authMiddleware, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const usuarioId = req.usuario.userId;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: 'Senha atual e nova senha são obrigatórias' });
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const senhaAtualValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaAtualValida) {
      return res.status(401).json({ erro: 'Senha atual incorreta' });
    }

    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10);

    usuario.senha = novaSenhaCriptografada;
    await usuario.save();

    res.json({ mensagem: 'Senha alterada com sucesso!' });

  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

const Relatorio = require('./ModeloRelacional/relatorios')

// E substituir todas as rotas de /atendimentos para /relatorios:

// Criar relatório
app.post('/relatorios', async (req, res) => {
  try {
    const relatorio = new Relatorio(req.body)
    await relatorio.save()
    res.status(201).json(relatorio)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar relatórios
app.get('/relatorios', async (req, res) => {
  try {
    const relatorios = await Relatorio.find()
      .populate('cliente_id', 'nome email telefone')
      .populate('servico_id', 'nome_servico')
      .populate('unidade_id', 'nome_unidade')
      .populate('colaborador_id', 'nome_colaborador especialidades')
      .populate('parceiro_id', 'nome')
    res.json(relatorios)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// Buscar relatórios por terapeuta
app.get('/relatorios/terapeuta/:terapeutaId', authMiddleware, async (req, res) => {
  try {
    const { terapeutaId } = req.params;

    const relatorios = await Relatorio.find({ colaborador_id: terapeutaId })
      .populate('cliente_id', 'nome email telefone')
      .populate('servico_id', 'nome_servico')
      .populate('unidade_id', 'nome_unidade')
      .populate('colaborador_id', 'nome_colaborador especialidades')
      .sort({ createdAt: -1 });

    res.json(relatorios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Buscar relatório específico
app.get('/relatorios/:id', authMiddleware, async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id)
      .populate('cliente_id', 'nome email telefone')
      .populate('servico_id', 'nome_servico')
      .populate('unidade_id', 'nome_unidade')
      .populate('colaborador_id', 'nome_colaborador especialidades');

    if (!relatorio) {
      return res.status(404).json({ erro: 'Relatório não encontrado' });
    }

    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Atualizar relatório
app.put('/relatorios/:id', authMiddleware, async (req, res) => {
  try {
    const relatorio = await Relatorio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('cliente_id', 'nome email telefone')
      .populate('servico_id', 'nome_servico')
      .populate('unidade_id', 'nome_unidade')
      .populate('colaborador_id', 'nome_colaborador especialidades');

    if (!relatorio) {
      return res.status(404).json({ erro: 'Relatório não encontrado' });
    }

    res.json({
      mensagem: 'Relatório atualizado com sucesso!',
      relatorio
    });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});