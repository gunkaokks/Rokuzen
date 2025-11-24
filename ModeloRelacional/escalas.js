const mongoose = require('mongoose');

const escalaSchema = new mongoose.Schema({
  colaborador_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colaborador',
    required: true
  },
  unidade_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unidade',
    required: true
  },
  data_escala: {
    type: Date,
    required: true
  },
  hora_inicio: {
    type: String,
    required: true
  },
  hora_fim: {
    type: String,
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Escala', escalaSchema);