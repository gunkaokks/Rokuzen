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
  valor: {
    type: Number,
    required: true
  },
  observacoes: String,
  criado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// verifica conflito de horário
agendamentoSchema.statics.verificarConflito = async function (terapeuta_id, inicio_sessao, fim_sessao) {
  const conflito = await this.findOne({
    terapeuta_id: terapeuta_id,
    status: 'agendado',
    $or: [
      {
        inicio_sessao: { $lt: new Date(fim_sessao) },
        fim_sessao: { $gt: new Date(inicio_sessao) }
      }
    ]
  });
  return conflito;
};

// Pra quando for usar a função de busca, achar o agendamento por terapeuta, usuário, unidade e status
agendamentoSchema.index({ terapeuta_id: 1, inicio_sessao: 1 });
agendamentoSchema.index({ usuario_id: 1, data_agendamento: 1 });
agendamentoSchema.index({ unidade_id: 1, inicio_sessao: 1 });
agendamentoSchema.index({ status: 1 });

module.exports = mongoose.model('Agendamento', agendamentoSchema);