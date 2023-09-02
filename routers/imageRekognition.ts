import express from 'express';
import fs from 'fs';
import multer from 'multer';
import { RekognitionClient, DetectLabelsCommand, Image, RecognizeCelebritiesCommand, DetectTextCommand } from '@aws-sdk/client-rekognition';
import { log } from 'console';
import { Log } from '../db/entities/Log.js';
const router = express.Router();
import path from 'path';

const rekognitionClient = new RekognitionClient({ region: 'eu-west-2' });

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'assets/')
    },
    filename(req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
    },
})

const upload = multer({ storage })
router.post('/identification', upload.single('file'), (req, res) => {


    if (req.file) {
        const imageURL = req.file.destination + req.file.filename
        const image = fs.readFileSync(path.normalize(imageURL))

        image.toString('base64')

        const params: Image = {
            Bytes: image
        }

        const detectLabels = new DetectLabelsCommand({ Image: params, MaxLabels: 1 });
        rekognitionClient.send(detectLabels)
            .then(data => {
                const log = new Log()
                log.imagePath = imageURL
                log.result = JSON.stringify(data)
                log.save()
                res.status(200).send(data)
            })
            .catch(err => res.status(500).send(err)); console.log(imageURL);
    } else {
        res.status(500).send("Failed to upload File!");
        return
    }

})
router.post('/celebrity', upload.single('file'), (req, res) => {


    if (req.file) {
        const imageURL = req.file.destination + req.file.filename
        const image = fs.readFileSync(imageURL)

        image.toString('base64')

        const params: Image = {
            Bytes: image
        }

        const recognizeCelebritiesCommand = new RecognizeCelebritiesCommand({ Image: params });

        rekognitionClient.send(recognizeCelebritiesCommand)
            .then(data => {
                if (data.CelebrityFaces && data.CelebrityFaces.length > 0) {
                    const log = new Log()
                    log.imagePath = imageURL
                    log.result = log.result = JSON.stringify(data)
                    log.save()

                    data.CelebrityFaces.forEach(celeb => res.status(200).send(celeb.Name));
                } else {

                    res.status(500).send('No celebrities recognized.');
                }
            })
            .catch(err => console.error('Error:', err));

    }
    else {
        res.status(500).send("Failed to upload File!");
        return
    }
})
router.post('/text', upload.single('file'), (req, res) => {


    if (req.file) {
        const imageURL = req.file.destination + req.file.filename
        const image = fs.readFileSync(imageURL)

        image.toString('base64')

        const params: Image = {
            Bytes: image
        }



        const detectTextCommand = new DetectTextCommand({ Image: params });

        rekognitionClient.send(detectTextCommand)
            .then(data => {
                if (data.TextDetections && data.TextDetections.length > 0) {

                    const log = new Log()
                    log.imagePath = imageURL
                    log.result = log.result = JSON.stringify(data)
                    log.save()
                    data.TextDetections.forEach(text => { if (text.Type === 'LINE') { res.status(200).send(text.DetectedText) } });
                } else {
                    console.log('No text detected.');
                }
            })
            .catch(err => console.error('Error:', err))
    }
    else {
        res.status(500).send("Failed to upload File!");
        return
    }

})

export default router