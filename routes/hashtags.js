// requirements
const mongoose = require('mongoose');
const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { check, validationResult } = require('express-validator');



// Follow/Unfollow
router.post('/followUnfollow', async(req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'hashtags');

        if(!user){
            res.send({
                err : true,
                msg : `User not found`
            })
        }
        else{
                
            if(req.body.action){
                user.hashtags.push(req.body.hashtag);
            }


            else{
                user.hashtags.pull(req.body.hashtag);   
            }

            let check = await user.save();

            if(!check){
                res.send({
                    err : true,
                    msg : `User was not updated successfully`
                })
            }

            else{
                res.send({
                    err : false,
                    msg : `Done`
                })
            }

        }


    } catch(err){
        console.log(err)
        res.send({
            err : true,
            msg : err
        })
    }

})




module.exports = router;