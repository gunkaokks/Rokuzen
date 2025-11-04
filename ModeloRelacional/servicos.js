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
  duracao_minutos: Number,
  valor_base: Number,
  ativo: { 
    type: Boolean, 
    default: true 
  },
  descricao: String
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Servico', servicoSchema);