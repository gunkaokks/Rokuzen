const mongoose = require('mongoose');

const atendimentoSchema = new mongoose.Schema({
  unidade_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Unidade', 
    required: true 
  },
  cliente_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cliente', 
    required: true 
  },
  servico_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Servico', 
    required: true 
  },
  colaborador_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Colaborador', 
    required: true 
  },
  parceiro_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Parceiro' 
  },
  
  inicio_atendimento: { 
    type: Date, 
    required: true 
  },
  fim_atendimento: { 
    type: Date, 
    required: true 
  },
  
  valor_servico: { 
    type: Number, 
    required: true 
  },
  tipo_pagamento: { 
    type: String, 
    enum: ['dinheiro', 'pix', 'cartao', 'cortesia'], 
    required: true 
  },
  status_pagamento: { 
    type: String, 
    enum: ['pendente', 'pago', 'cancelado'], 
    default: 'pendente' 
  },
  
  observacao_cliente: String,
  foi_marcado_online: { 
    type: Boolean, 
    default: false 
  },
  pacote_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pacote' 
  },
  
  duracao_real_minutos: Number,
  satisfacao_cliente: { 
    type: Number, 
    min: 1, 
    max: 5 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Atendimento', atendimentoSchema);