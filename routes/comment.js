// requirements
const mongoose = require('mongoose');
const express = require('express');
const User = require('../models/user');
const Comment = require('../models/comment');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { check, validationResult } = require('express-validator');


// New comment
router.post('/new', async (req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.owner_id});
        if(!user){
            return res.send({
                err : true,
                msg : `User not found`
            })
        }
        else{

            let bComment;
            let rComment;


            // Checking if the user is in post owner's blockedUserFromComment[]
            let BUFC = user.blockedUserFromComment;
            let index = BUFC.indexOf(req.body.u_id);
            bComment = (index > -1);


            // Checking if the user is in post owner's restrictAccounts[]
            if(user.restrictedAccount){
                let restrictAccounts = user.restrictAccounts;
                index = restrictAccounts.indexOf(req.body.u_id);
                rComment = (index > -1);
            }

            // creating new comment
            const comment = new Comment({

                p_id : req.body.p_id,
                u_id : req.body.u_id,
                commentText : req.body.commentText,
                bComment : bComment,
                rComment : rComment,
                timeStamp : Date.now(),
                owner_id : req.body.owner_id

            });

            // saving the comment
            let check = await comment.save();
            
            // Safe-check
            if(!check){
                res.send({
                    err : true,
                    msg : `Couldn't complete the posting process`
                });
            }

            else{
                res.send({
                    err : false,
                    msg : `DONE!`
                })
            }

        }
    } catch(err){
        res.send(err);
    }

})



// Delete Comment
router.delete('/delete', async(req,res) => {

    try{

        let check = await Comment.deleteOne({'_id' : req.body.c_id});
        if(!check){
            res.send({
                err : true,
                msg : `An error occurred`
            })
        }
        else{
            res.send(check);
        }

    } catch(err){
        res.send({
            err : true,
            msg : `Try block failed`
        })
    }

})




module.exports = router;