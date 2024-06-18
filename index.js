const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const nodemailer = require("nodemailer");
const app = express()
const port = process.env.PORT || 5000

// midlewear 
// app.use(cors())
app.use(express.json())

// kekp hyvl gwed ybfv


// send email functionality
const sendEmail = (emailAddress, emailDetails) =>{
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
          user: process.env.TRANSPORTER_MAIL,
          pass: process.env.TRANSPORTER_PASS,
        },
      });

      // varify
      transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      });

      const mailBody = {
        from: `"ShineFix" <${process.env.TRANSPORTER_MAIL}>`, // sender address
        to: emailAddress, // list of receivers
        subject: emailDetails.subject, // Subject line
        html: emailDetails.message, // html body
      }

     transporter.sendMail(mailBody, (error, info)=>{
        if(error) {
            console.log(error);
        }else{
            console.log('email send: ', info.response);
        }
     });

      
}


const corsConfig = {
    origin: ["http://localhost:5173", "https://shinefix-a-10.web.app", "https://shinefix-a-10.firebaseapp.com"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
};
app.use(cors(corsConfig));

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

        app.get('/services', async (req, res) => {
            const filter = req.query;
            const query = {}
            const options = {
                sort: {
                    servicePrice: filter.sort === 'asc' ? 1 : -1
                },
                collation: {
                    locale: "en_US",
                    numericOrdering: true
                }
            }

            if (filter.sort === "asc" || filter.sort === "dsc") {
                const cursor = serviceCollection.find(query, options)
                const result = await cursor.toArray()
                res.send(result)
            } else {
                const cursor = serviceCollection.find()
                const result = await cursor.toArray()
                res.send(result)
            }
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })

        app.get('/services/email/:providerEmail', async (req, res) => {
            const email = req.params.providerEmail;
            const query = { providerEmail: email }
            const result = await serviceCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/services', async (req, res) => {
            const newService = req.body
            const result = await serviceCollection.insertOne(newService)
            res.send(result)
        })

        app.patch('/services/id/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: new ObjectId(id) }
            const updateData = {
                $set: {
                    serviceName: data.serviceName,
                    servicePhoto: data.servicePhoto,
                    servicePrice: data.servicePrice,
                    serviceArea: data.serviceArea,
                    description: data.description,
                }
            }

            const result = await serviceCollection.updateOne(query, updateData)
            res.send(result)
        })

        app.delete('/services/id/:id', async (req, res) => {
            const id = req.params.id;
            try {
                console.log(id);
                const query = { _id: new ObjectId(id) }
                const result = await serviceCollection.deleteOne(query)
                res.send(result)

            }
            catch (error) {
                console.error("Error deleting service:", error);
                res.status(500).send("Error deleting service")
            }
        })

        // ========== server AIP for booked services ============
        app.get('/bookedServices', async (req, res) => {
            const cursor = bookedCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/bookedServices/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookedCollection.findOne(query)
            res.send(result)
        })

        app.get('/bookedServices/email/:currentUseremail', async (req, res) => {
            const email = req.params.currentUseremail;
            const query = { currentUseremail: email }
            const result = await bookedCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/bookedServices/provider/:providerEmail', async (req, res) => {
            const email = req.params.providerEmail;
            const query = { providerEmail: email }
            const result = await bookedCollection.find(query).toArray()
            res.send(result)
        })

        app.patch('/bookedServices/:id', async (req, res) => {
            const id = req.params.id
            const status = req.body
            const query = { _id: new ObjectId(id) }
            const updateData = {
                $set: status
            }
            const result = await bookedCollection.updateOne(query, updateData)
            res.send(result)
        })

        app.post('/bookedServices', async (req, res) => {
            const newBooekdService = req.body;
            const result = await bookedCollection.insertOne(newBooekdService)
            
            // send email to user
            console.log('current user ==>',newBooekdService?.currentUseremail);
            sendEmail(newBooekdService?.currentUseremail, {
                subject: 'Booking successfull',
                message: 'You have successfully book a service, Service provider contact you as soon as possible'
            })
            // send email to provider
            sendEmail(newBooekdService?.providerEmail, {
                subject: `${newBooekdService.currentUserName} booked your service ${newBooekdService.serviceName}`,
                message: `${newBooekdService.instruction}`
            })

            res.send(result)
        })

        // await client.db("admin").command({ ping: 1 });
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