const mongoose = require('mongoose');

const unidadeSchema = new mongoose.Schema({
  nome_unidade: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Unidade', unidadeSchema);