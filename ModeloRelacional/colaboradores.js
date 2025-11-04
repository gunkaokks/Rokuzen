const mongoose = require('mongoose');

const colaboradorSchema = new mongoose.Schema({
  nome_colaborador: { 
    type: String, 
    required: true 
  },
  ativo: { 
    type: Boolean, 
    default: true 
  },
  tipo_colaborador: { 
    type: Number, 
    default: 3  // 3 = terapeuta
  },
  especialidades: [String],
  email: String,
  telefone: String
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Colaborador', colaboradorSchema);