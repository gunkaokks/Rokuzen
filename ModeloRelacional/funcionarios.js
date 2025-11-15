const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const funcionarioSchema = new mongoose.Schema({
  nome_funcionario: { 
    type: String, 
    required: true 
  },
  ativo: { 
    type: Boolean, 
    default: true 
  },
  // Tipos de funcionario com os números:
  // 1 - Master
  // 2 - Gerente
  // 3 - Recepção
  // 4 - Terapeuta
  tipo_funcionario: { 
    type: Number, 
    default: 3
  },
  especialidades: [String],
  email: String,
  telefone: String,
  senha: { 
    type: String, 
    default: function() {
      return bcrypt.hashSync("123456", 10);
    }
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Funcionario', funcionarioSchema);