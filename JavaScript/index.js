
const express = require ('express')
const cors = require ('cors')
const mongoose = require ('mongoose')
const app = express()
app.use(express.json())
app.use(cors())


async function conectarAoMongoDB() {
await
mongoose.connect(`mongodb+srv://bruno_santos:<senha>@rokuzen.ncrtj8k.mongodb.net/?appName=rokuzen`)
}

app.listen(3000, () => {
try{
conectarAoMongoDB()
console.log("up and running")
}
catch (e){
console.log('Erro', e)
}
})