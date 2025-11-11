const usuarioSchema = mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  telefone: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['master', 'gerente', 'recepcao', 'terapeuta', 'usuario'], default: 'usuario' },
  data_criacao: { type: Date, default: Date.now }
})
usuarioSchema.plugin(uniqueValidator)
const Usuario = mongoose.model("Usuario", usuarioSchema)

const sessoesAtivas = {}
