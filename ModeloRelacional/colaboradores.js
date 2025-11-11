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
  email: String,
  telefone: String
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Colaborador', colaboradorSchema);