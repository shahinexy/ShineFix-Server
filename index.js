const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// midlewear 
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.76h69in.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        //   await client.connect();

        const serviceCollection = client.db("servicesDB").collection('services');
        const bookedCollection = client.db("servicesDB").collection('bookedServices');

        app.get('/services', async (req, res) =>{
            const cursor = serviceCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/services/:id', async (req,res)=>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })

        app.post('/services', async (req, res) =>{
            const newService = req.body
            const result = await serviceCollection.insertOne(newService)
            res.send(result)
        })

        //server AIP for booked services
        app.get('/bookedServices', async (req, res) =>{
            const cursor = bookedCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/bookedServices', async (req,res)=>{
            const newBooekdService = req.body;
            const result = await bookedCollection.insertOne(newBooekdService)
            res.send(result)
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Home Repair Service Server is Running")
})

app.listen(port, () => {
    console.log("Home Service Server Running on Port:", port);
})