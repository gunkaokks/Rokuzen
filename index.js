// npm init -y 
// npm install express mongoose body-parser nodemon bcrypt nodemailer dotenv cors
// Para executar, use o comando "node server.js"
// Deve aparecer a mensagem: "Servidor rodando em http://localhost:3000 e conectado ao MongoDB"

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const uniqueValidator = require('mongoose-unique-validator')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

const stringConexaoBD = process.env.CONEXAO_BD

//função de conexão com o banco
async function conectarAoMongoDB() {
    await mongoose.connect(stringConexaoBD)
}

app.listen(3000, () => {
    try {
        conectarAoMongoDB()
        console.log("up and running")
    }
    catch (e) {
        console.log('Erro', e)
    }
})