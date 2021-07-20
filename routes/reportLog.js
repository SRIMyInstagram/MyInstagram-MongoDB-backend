// requirements
const mongoose = require('mongoose');
const express = require('express');
const ReportLog = require('../models/reportLog');
const router = express.Router();
const { check, validationResult } = require('express-validator');


// New entry
router.post('/new', async(req, res) => {

    try{
        let entry = new ReportLog({

            object_id : req.body.object_id,
            entity : req.body.entity

        });

        let check = await entry.save();

        // Safe-check
        if(!check){
            res.send({
                err : true,
                msg : `Couldn't complete the reporting process`
            });
        }

        else{
            res.send({
                err : false,
                msg : `DONE!`
            })
        }
    } catch(err){
        res.send({
            err : true,
            msg : `Try block failed`
        })
    }

})



module.exports = router;