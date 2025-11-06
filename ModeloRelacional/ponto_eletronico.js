const mongoose = require('mongoose');

const pontoEletronicoSchema = new mongoose.Schema({
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
  entrada: { 
    type: Date, 
    required: true 
  },
  saida: Date,
  data: String,
  esta_presente: { 
    type: Boolean, 
    default: true 
  },
  fez_recepcao: { 
    type: Boolean, 
    default: false 
  },
  pontos_recepcao: { 
    type: Number, 
    default: 0 
  },
  cobriu_colega: { 
    type: Boolean, 
    default: false 
  },
  observacoes: String
}, { 
  timestamps: true 
});

module.exports = mongoose.model('PontoEletronico', pontoEletronicoSchema);