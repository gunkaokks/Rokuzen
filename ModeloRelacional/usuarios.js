const mongoose = require('mongoose');

const usuarioSchema = mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  telefone: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['master', 'gerente', 'recepcao', 'terapeuta', 'usuario'], default: 'usuario' }
}, {
  timestamps: true
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

module.exports = Usuario;