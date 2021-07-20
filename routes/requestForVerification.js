// requirements
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const RFV = require('../models/requestForVerification');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const path = require('path');
const multer = require('multer');
const mongodb = require('mongodb');
const {GridFsStorage} = require('multer-gridfs-storage');
const crypto = require('crypto');
const Post = require('../models/post');



// express app setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// connection string, connection establishment
mongoose.connect('mongodb://localhost:27017/MyInstagram', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});



// connection establishment check
const db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error'));
let gfs;
db.once('open', ()=>{
    gfs = new mongodb.GridFSBucket(db.db, { bucketName : 'media' });
});



// storage engine creation
const storage = new GridFsStorage({
    
    url: 'mongodb://localhost:27017/MyInstagram',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if(err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'media'
                };
                resolve(fileInfo);
            });
        });
    },
    options: { useUnifiedTopology: true }
});

const upload = multer({storage});




// New entry
router.post('/new', upload.single('proof'), async(req,res) => {

    try{

        let rfv = new RFV({

            u_id : req.body.u_id,
            fullname : req.body.fullname,
            knownAs : req.body.knownAs,
            category : req.body.category,
            image : req.file.id

        })

        let check = await rfv.save();

        if(!check){
            return res.send({
                err : true,
                msg : `Failed`
            })
        }

        else{
            res.send({
                message : `Done`
            })
        }

    } catch(err){
        res.send(err);
    }

})





module.exports = router;