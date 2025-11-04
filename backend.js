const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const uniqueValidator = require('mongoose-unique-validator')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

const stringConexaoBD = process.env.CONEXAO_BD

async function conectarAoMongoDB () {
  await mongoose.connect(stringConexaoBD)
}

// Aqui são os modelos de banco de dados que a Rokuzen disponibilizou pra gente

// Unidades
const unidadeSchema = new mongoose.Schema({
  nome_unidade: { type: String, required: true }
}, { timestamps: true })
const Unidade = mongoose.model("Unidade", unidadeSchema)

// Clientes
const clienteSchema = new mongoose.Schema({
  nome_cliente: { type: String, required: true },
  email_cliente: { type: String, unique: true },
  telefone_cliente:{ type: String, unique: true }, data_nascimento: Date,
  respostas_saude: { tem_dor_cronica: Boolean, local_dor: String, pressao_arterial: String, gravidez: Boolean,
    medicamentos: [String],
    alergias: [String]}, primeiro_atendimento: Date, observacoes: String
}, { timestamps: true })
clienteSchema.plugin(uniqueValidator)
const Cliente = mongoose.model("Cliente", clienteSchema)

// Colaboradores
const colaboradorSchema = new mongoose.Schema({
  nome_colaborador: { type: String, required: true },
  ativo: { type: Boolean, default: true },
  tipo_colaborador: { type: Number, default: 3 },
  especialidades: [String], email: String, telefone: String
}, { timestamps: true })
const Colaborador = mongoose.model("Colaborador", colaboradorSchema)

// Serviços
const servicoSchema = new mongoose.Schema({
  unidade_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unidade', required: true },
  nome_servico: { type: String, required: true }, duracao_minutos: Number, valor_base: Number,
  ativo: { type: Boolean, default: true }, descricao: String
}, { timestamps: true })
const Servico = mongoose.model("Servico", servicoSchema)

// Atendimentos
const atendimentoSchema = new mongoose.Schema({
  unidade_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unidade', required: true },
  cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  servico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Servico', required: true },
  colaborador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador', required: true },
  parceiro_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parceiro' },
  
  inicio_atendimento: { type: Date, required: true },
  fim_atendimento: { type: Date, required: true },
  
  valor_servico: { type: Number, required: true },
  tipo_pagamento: { type: String, enum: ['dinheiro', 'pix', 'cartao', 'cortesia'], required: true },
  status_pagamento: { type: String, enum: ['pendente', 'pago', 'cancelado'], default: 'pendente' }, observacao_cliente: String,
  foi_marcado_online: { type: Boolean, default: false },
  pacote_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pacote' },
  
  duracao_real_minutos: Number,
  satisfacao_cliente: { type: Number, min: 1, max: 5 }
}, { timestamps: true })
const Atendimento = mongoose.model("Atendimento", atendimentoSchema)

// Escalas
const escalaSchema = new mongoose.Schema({
  colaborador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador', required: true },
  unidade_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unidade', required: true },
  inicio_escala: { type: Date, required: true },
  fim_escala: { type: Date, required: true }, dia_semana: String,
  tipo_escala: { type: String, enum: ['normal', 'extra', 'feriado'], default: 'normal' }
}, { timestamps: true })
const Escala = mongoose.model("Escala", escalaSchema)

// Pontos eletrônicos
const pontoEletronicoSchema = new mongoose.Schema({
  colaborador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador', required: true },
  unidade_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unidade', required: true },
  entrada: { type: Date, required: true }, saida: Date, data: String,
  esta_presente: { type: Boolean, default: true },
  fez_recepcao: { type: Boolean, default: false },
  pontos_recepcao: { type: Number, default: 0 },
  cobriu_colega: { type: Boolean, default: false }, observacoes: String
}, { timestamps: true })
const PontoEletronico = mongoose.model("PontoEletronico", pontoEletronicoSchema)

// Aqui é o sistema de login, cadastro etc

const usuarioSchema = mongoose.Schema({
  nome: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  senha: {type: String, required: true},
  telefone: {type: String, required: true, unique: true},
  tipo: {type: String, enum: ['master', 'gerente', 'recepcao', 'terapeuta', 'usuario'], default: 'usuario'},
  data_criacao: { type: Date, default: Date.now }
})
usuarioSchema.plugin(uniqueValidator)
const Usuario = mongoose.model("Usuario", usuarioSchema)

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
    
    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10)
    
    console.log('Senha criptografada com sucesso')

    const usuario = new Usuario({
      nome: nome,
      email: email,
      senha: senhaCriptografada,
      telefone: telefone,
      tipo: tipo
    })
    
    // Salva no banco
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

    const sessaoId = Math.random().toString(36).substring(2)
    sessoesAtivas[sessaoId] = {
      usuarioId: usuario._id,
      email: usuario.email,
      tipo: usuario.tipo
    }

    res.json({
      mensagem: 'Login realizado com sucesso!',
      sessaoId: sessaoId,
      usuario: {
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

// Aqui é pra mexer nos clientes e unidades (função do gerente)

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

app.listen(3000, () => {
    try {
      conectarAoMongoDB()
      console.log('server up & running & conexão ok')
      console.log('📊 Sistema de atendimentos integrado!')
    }
    catch (e) {
      console.log("erro:" + e)
    }
})