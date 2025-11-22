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
  inicio_escala: { 
    type: Date, 
    required: true 
  },
  fim_escala: { 
    type: Date, 
    required: true 
  },
  dia_semana: String,
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Escala', escalaSchema);