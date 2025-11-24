const mongoose = require('mongoose');

const colaboradorSchema = new mongoose.Schema({
  unidade_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unidade',
    required: true
  },
  nome_colaborador: {
    type: String,
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  // Tipos de colaboradores com os números:
  // 1 - Master
  // 2 - Gerente
  // 3 - Recepção
  // 4 - Terapeuta
  tipo_colaborador: {
    type: Number,
    default: 3
  },
  especialidades: [String],
  disponivel: {
    type: Boolean,
    default: true
  },
  posto_atual: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Posto',
    default: null
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  telefone: String,
  senha: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Colaborador', colaboradorSchema);