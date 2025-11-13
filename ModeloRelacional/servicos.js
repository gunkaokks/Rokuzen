const mongoose = require('mongoose');

const servicoSchema = new mongoose.Schema({
  unidade_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Unidade', 
    required: true 
  },
  nome_servico: { 
    type: String, 
    required: true 
  },
  opcoes_duracao: [{
    duracao: { type: Number, required: true },
    valor: { type: Number, required: true },
    descricao: { type: String }
  }],
  duracao_minima: { type: Number, default: 15 },
  duracao_maxima: { type: Number, default: 120 },
  ativo: { 
    type: Boolean, 
    default: true 
  },
  descricao: String
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Servico', servicoSchema);