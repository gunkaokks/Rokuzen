const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Unidade = require('./ModeloRelacional/unidades')
const Cliente = require('./ModeloRelacional/clientes')
const Colaborador = require('./ModeloRelacional/colaboradores')
const Servico = require('./ModeloRelacional/servicos')
const Agendamento = require('./ModeloRelacional/agendamento')
const Atendimento = require('./ModeloRelacional/atendimentos')
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
}
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Token de acesso requerido' });
    }

    jwt.verify(token, "chave-secreta", (err, usuario) => {
        if (err) {
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

app.post('/signup', async (req, res) => {
  try {
    console.log('Dados recebidos no signup:', req.body)

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

    console.log('Criptografando senha...')
    const senhaCriptografada = await bcrypt.hash(senha, 10)
    console.log('Senha criptografada com sucesso')

    const usuario = new Usuario({
      nome: nome,
      email: email,
      senha: senhaCriptografada,
      telefone: telefone,
      tipo: tipo
    })

    const respostaMongo = await usuario.save()
    console.log('Usuário salvo no MongoDB:', respostaMongo._id)

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso!',
      usuario: {
        nome: nome,
        email: email,
        telefone: telefone,
        tipo: tipo,
        data_criacao: respostaMongo.data_criacao
      }
    })
  }
  catch (exception) {
    console.log('Erro no cadastro:', exception.message)

    if (exception.code === 11000) {
      return res.status(409).json({ erro: 'Email já existe' })
    }

    res.status(500).json({ erro: 'Erro interno: ' + exception.message })
  }
})

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

    const token = jwt.sign(
      { email: email },
      "chave-secreta",
      { expiresIn: "1h" }
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
        tipo: usuario.tipo,
        data_criacao: usuario.data_criacao
      }
    })

  } catch (erro) {
    console.log(erro)
    res.status(500).json({ erro: 'Erro no servidor' })
  }
})

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

// Criar cliente
app.post('/clientes', async (req, res) => {
  try {
    const cliente = new Cliente(req.body)
    await cliente.save()
    res.status(201).json(cliente)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar clientes
app.get('/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find()
    res.json(clientes)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

// Criar colaborador
app.post('/colaboradores', async (req, res) => {
  try {
    const colaborador = new Colaborador(req.body)
    await colaborador.save()
    res.status(201).json(colaborador)
  } catch (erro) {
    res.status(400).json({ erro: erro.message })
  }
})

// Listar colaboradores
app.get('/colaboradores', async (req, res) => {
  try {
    const colaboradores = await Colaborador.find()
    res.json(colaboradores)
  } catch (erro) {
    res.status(500).json({ erro: erro.message })
  }
})

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
app.patch('/agendamentos/:id/cancelar', async (req, res) => {
  try {
    const agendamento = await Agendamento.findById(req.params.id);

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }

    if (agendamento.status === 'cancelado') {
      return res.status(400).json({ erro: 'Agendamento já está cancelado' });
    }

    if (agendamento.inicio_sessao < new Date()) {
      agendamento.status = 'nao_compareceu';
    } else {
      agendamento.status = 'cancelado';
    }

    await agendamento.save();

    res.json({
      mensagem: 'Agendamento cancelado com sucesso!',
      agendamento
    });

  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

app.listen(3000, () => {
  try {
    conectarAoMongoDB()
    console.log('server up & running & conexão ok')
    console.log('Sistema de agendamentos Rokuzen funcionando!')
  }
  catch (e) {
    console.log("erro:" + e)
  }
})