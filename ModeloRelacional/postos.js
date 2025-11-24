const mongoose = require('mongoose');

const postoSchema = new mongoose.Schema({
    unidade_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unidade',
        required: true
    },
    nome_posto: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['livre', 'ocupado','intervalo', 'manutencao'],
        default: 'livre'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Posto', postoSchema);