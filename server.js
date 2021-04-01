#!/usr/bin/env node

const express = require('express')
const path = require('path')

const app = express()

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")))

const multer = require('multer')
const upload = multer({ dest: path.join(__dirname, 'public/uploads/') })

const { MongoClient } = require('mongodb')
const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017'
const dbName = process.env.MONGO_DB_NAME || 'image_upload_basic'
const client = new MongoClient(mongoUrl, { useUnifiedTopology: true, useNewUrlParser: true })

async function connectClient() {
  if (client.isConnect()) {
    return
  }
  await client.connect()
}
  
app.get("/", async (req, res) => {
  try {
    await connectClient()
    const db = client.db(dbName)
    const images = await db.collection("images").find().toArray()
    res.render('index', { images })
  } catch (error) {
    console.log(error)
    res.status(500).send({error: error.message})
  }
})



app.post("/images", upload.single('image'), async (req, res) => {
  try {
    await connectClient()
    const db = client.db(dbName)
    const description = req.body.description
    const filename = req.file.filename
    await db.collection("images").insertOne({
      description,
      imageUrl: `/uploads/${filename}`
    })
    res.redirect("/")
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message })
  }
})

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`listening on port ${port}`))

