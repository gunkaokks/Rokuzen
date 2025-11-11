const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
  usuario_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  terapeuta_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Colaborador', 
    required: true 
  },
  unidade_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Unidade', 
    required: true 
  },
  servico_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Servico', 
    required: true 
  },

  data_agendamento: { 
    type: Date, 
    required: true 
  },
  inicio_sessao: { 
    type: Date, 
    required: true 
  },
  fim_sessao: { 
    type: Date, 
    required: true 
  },

  status: { 
    type: String, 
    enum: ['agendado', 'cancelado', 'nao_compareceu'], 
    default: 'agendado'
  },
  
// Isso aqui é só pra salvar de que usuário é o agendamento, salva o id do cliente e quando foi criado o agendamento
  observacoes: String,
  criado_por: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario',
    required: true 
  }

}, { 
  timestamps: true
});

// pra quando for usar a função de busca, achar o agendamento por terapeuta, usuário, unidade e status
agendamentoSchema.index({ terapeuta_id: 1, inicio_sessao: 1 });
agendamentoSchema.index({ usuario_id: 1, data_agendamento: 1 });
agendamentoSchema.index({ unidade_id: 1, inicio_sessao: 1 });
agendamentoSchema.index({ status: 1 });

module.exports = mongoose.model('Agendamento', agendamentoSchema);