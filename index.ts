import 'dotenv/config'

import imageRekognitionRoute from './routers/imageRekognition.js'
import express from 'express';
import { DataSource } from 'typeorm';
import { Log } from './db/entities/Log.js';

const app = express();
const PORT = process.env.PORT || 3000
app.use(express.json());

const dataSource = new DataSource({
    type: "mysql",
    host: "meo.ckxcq2pvrc9s.eu-west-2.rds.amazonaws.com",
    port: 3306,
    username: "admin",
    password: "rQjLt2ePdJ2qxAM01ufl",
    database: "gsg_hackaton_logs",
    entities: [Log],
    logging: true,
    synchronize: true
});

app.use('/health', (req, res) => {
    res.sendStatus(200)
})

app.use('/rekognition', imageRekognitionRoute)

app.listen(PORT, () => {
    console.log(`Connect to port ${PORT}`);
    dataSource
        .initialize()
        .then(() => {
            console.log("connected to DB");
        })
        .catch((error) => {
            console.log("error: ", error);
        });

})
