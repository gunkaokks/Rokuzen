const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nome_cliente: { 
    type: String, 
    required: true 
  },
  email_cliente: { 
    type: String, 
    unique: true 
  },
  telefone_cliente: String,
  data_nascimento: Date,
  respostas_saude: {
    tem_dor_cronica: Boolean,
    local_dor: String,
    pressao_arterial: String,
    gravidez: Boolean,
    medicamentos: [String],
    alergias: [String],
    cirurgias_anteriores: [String],
    atividades_fisicas: String
  },
  primeiro_atendimento: Date,
  observacoes: String
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Cliente', clienteSchema);