// requirements
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const router = express.Router();
const methodOverride = require('method-override');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const crypto = require('crypto');
const Post = require('../models/post');
const User = require('../models/user');
const Hashtag = require('../models/hashtags');


// express app setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));




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




// Create a new post
router.put('/new', upload.array('media', 10), async (req, res) => {

    try{

        let content = [];
        let store = req.files;

        // storing refernces of the images/videos in content[]
        await store.forEach((element) => {
            console.log(element);
            content.push(element.filename);
        });


        // jsonifying tagged[]
        let taggedUsers = [];
        let tempTagged = req.body.tagged;
        if(tempTagged && Array.isArray(tempTagged)) await tempTagged.forEach((element) => {
            let jsonified = JSON.parse(element);
            taggedUsers.push(jsonified);
        });
        else if(tempTagged && !Array.isArray(tempTagged)){
            let jsonified = JSON.parse(tempTagged);
            taggedUsers.push(jsonified);
        };


        // New entry for the post
        let post = new Post({
            
            u_id : req.body.u_id,
            createdAt : Date.now(),
            modifiedAt : Date.now(),
            caption : req.body.caption,
            location : req.body.location,
            tagged : taggedUsers,
            type : req.body.type,
            hashTags : req.body.hashTags,
            title : req.body.title,
            content : content,
            music : req.body.music

        });

        // Safe-check
        let check = post.save();
        if(!check){
            res.send({
                err : true,
                msg : `Couldn't complete the posting process`
            });
        }

        else{
            res.send({
                err : false,
                value : post
            });

            // incrementing user's postCount and adding p_id to posts[]
            let user = await User.findOne({'_id' : req.body.u_id});
            
            let count = user.postCount + 1;
            user.postCount = count;

            let posts = user.posts;
            posts.push(post._id);
            user.posts = posts;

            // Safe-check
            let check = await user.save();
            if(!check) {
                res.send({
                    err : true,
                    msg : `Couldn't complete the posting process`
                });
            }

            else{

                // Inserting post's id corresponding hashtags
                let tags = req.body.hashTags;

                if(tags) await tags.forEach( async (element) => {
                    let temp = await Hashtag.findOne({'_id' : element});

                    // if not already available, create one, else, push into existing
                    if(!temp){
                        temp = new Hashtag({
                            _id : element,
                            posts : [ post._id ]
                        })
                    }
                    else{
                        let temp2 = temp.posts;
                        temp2.push(post._id);
                        temp.posts = temp2;
                    }
                    
                    // Safe-check
                    let check = await temp.save();
                    if(!check) {
                        res.send({
                            err : true,
                            msg : `Couldn't complete the posting process`
                        });
                    }

                });

                // adding the post_id in each tagged user's taggedIn[]
                if(taggedUsers) await taggedUsers.forEach( async (element) => {
                    
                    let tempUser = await User.findOne({'_id' : element.u_id});

                    if(tempUser && tempUser.allowTagsFrom==='following'){
                        let following = tempUser.following;
                        let confirm = following.find(post.u_id);
                        if(confirm && !tempUser.manuallyApproveTags){
                            let taggedIn = tempUser.taggedIn;
                            taggedIn.push(post._id);
                            tempUser.taggedIn = taggedIn;
                        }
                        else if (confirm && tempUser.manuallyApproveTags){
                            let confirmTag = tempUser.toConfirmTag;
                            confirmTag.push(post._id);
                            tempUser.toConfirmTag = confirmTag;
                        }
                    }
                    else if(tempUser && tempUser.allowTagsFrom==='all'){
                        if(!tempUser.manuallyApproveTags){
                            let taggedIn = tempUser.taggedIn;
                            taggedIn.push(post._id);
                            tempUser.taggedIn = taggedIn;
                        }
                        else if (tempUser.manuallyApproveTags){
                            let confirmTag = tempUser.toConfirmTag;
                            confirmTag.push(post._id);
                            tempUser.toConfirmTag = confirmTag;
                        }
                    }

                    // Safe-check
                    let done;
                    if(tempUser) done = await tempUser.save();
                    if(!done){
                        res.send({
                            err : true,
                            msg : `couldn't tag ${tempUser.username}`
                        })
                    }
                });
            }
        }
    } catch (err){
        console.error(err);
    }
});



// Liking/Unliking a post
router.post(
    '/likeUnlike',
    
    [
        check('action', 'No action performed').not().isEmpty()
    ],

    async (req, res) => {
        
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.send({
                err : true,
                msg : errors
            })
        }

        else{

            try{

                // req.body.action === 1  =>  Like
                let post;
                if(req.body.action){

                    post = await Post.findOneAndUpdate({'_id' : req.body.p_id}, { $inc : { 'likes' : 1 } }, {useFindAndModify : false, new : true}).exec();
                    
                    // add u_id to likedBy[] of corresponding post
                    let likedBy = post.likedBy;
                    likedBy.push(req.body.u_id);
                    post.likedBy = likedBy;

                    // add p_id to the user's liked[]
                    let user = await User.findOne({'_id' : req.body.u_id});
                    let liked = user.liked;
                    liked.push(req.body.p_id);
                    user.liked = liked;

                    // Safe-check
                    let check = await user.save();
                    if(!check){
                        return res.send({
                            er : true,
                            msg : `action unsuccessful`
                        })
                    }
                    
                }

                // req.body.action === 0  =>  Unlike
                else{

                    post =  await Post.findOneAndUpdate({'_id' : req.body.p_id}, { $inc : { 'likes' : -1 } }, {useFindAndModify : false, new : true}).exec();

                    // remove u_id from post's likedBy[]
                    let likedBy = post.likedBy;
                    let index = likedBy.indexOf(req.body.u_id);
                    if(index>-1){
                        let p = likedBy.splice(index, 1);
                    }
                    post.likedBy = likedBy;

                    // remove p_id from user's liked[]
                    let user = await User.findOne({'_id' : req.body.u_id});
                    let liked = user.liked;
                    index = liked.indexOf(req.body.p_id);
                    if(index>-1){
                        let p = liked.splice(index,1);
                    }
                    user.liked = liked;

                    // Safe-check
                    let check = await user.save();
                    if(!check){
                        return res.send({
                            er : true,
                            msg : `action unsuccessful`
                        })
                    }

                }

                // Safe-check
                let check = await post.save();
                if(!check){
                    return res.send({
                        er : true,
                        msg : `action unsuccessful`
                    })
                }
                else{
                    res.send({
                        err : false,
                        msg : `Done!`
                    });
                }

            } catch (err){
                return res.send({
                    err : true,
                    msg : `Can't complete the request`
                })
            }

        }
})



// Save/Unsave Post
router.post('/saveUnsave', async (req, res) => {
    
    try{

        // req.body.action === 1  =>  Save
        let post;
        if(req.body.action){

            post = await Post.findOneAndUpdate({'_id' : req.body.p_id}, { $inc : { 'savedCount' : 1 } }, {useFindAndModify : false, new : true}).exec();

            // add p_id to the user's savedPosts[]
            let user = await User.findOne({'_id' : req.body.u_id});
            let savedPosts = user.savedPosts;
            savedPosts.push(req.body.p_id);
            user.savedPosts = savedPosts;

            // Safe-check
            let check = await user.save();
            if(!check){
                return res.send({
                    er : true,
                    msg : `action unsuccessful`
                })
            }
            
        }

        // req.body.action === 0  =>  Unsave
        else{

            post =  await Post.findOneAndUpdate({'_id' : req.body.p_id}, { $inc : { 'savedCount' : -1 } }, {useFindAndModify : false, new : true}).exec();

            // remove p_id from the user's savedPosts[]
            let user = await User.findOne({'_id' : req.body.u_id});
            let savedPosts = user.savedPosts;
            index = savedPosts.indexOf(req.body.p_id);
            if(index>-1){
                let p = savedPosts.splice(index,1);
            }
            user.savedPosts = savedPosts;

            // Safe-check
            let check = await user.save();
            if(!check){
                return res.send({
                    er : true,
                    msg : `action unsuccessful`
                })
            }

        }

        // Safe-check
        let check = await post.save();
        if(!check){
            return res.send({
                er : true,
                msg : `action unsuccessful`
            })
        }
        else{
            res.send({
                err : false,
                msg : `Done!`
            });
        }

    } catch(err){
        res.send(err);
    }
})




// Archive/Unarchive a post
router.patch('/archiveUnarchive', async (req,res) => {

    try{

        let post = await Post.findOne({'_id' : req.body.p_id}, 'archived');
        
        if(!post){
            res.send({
                err : true,
                msg : `Post not found`
            })
        }
        
        else{
            
            // req.body.action===1  =>  archived
            if(req.body.action){
                post.archived = true;
            }

            // req.body.archived!==1  =>  not archived
            else post.archived = false;

            let check = await post.save();

            if(!check){
                return res.send({
                    err : true,
                    msg : `Unable to save the post`
                })
            }

            else{

                let user;
                if(post.archived){
                    user = await User.findOneAndUpdate({'_id' : req.body.owner_id}, { $inc : { 'postCount' : -1 } }, {useFindAndModify : false, new : true}).exec();
                }
                else user = await User.findOneAndUpdate({'_id' : req.body.owner_id}, { $inc : { 'postCount' : 1 } }, {useFindAndModify : false, new : true}).exec();


                res.send({
                    err : false,
                    msg : `Done`
                })
            }

        }

    } catch(err){
        res.send({
            err : ture,
            msg : `Try block failed`
        })
    }

})




// Turn commenting on/off
router.patch('/commenting', async(req,res) => {

    try{

        let post = await Post.findOne({'_id' : req.body.p_id}, 'commenting');

        if(!post){
            res.send({
                err : true,
                msg : `No such post found`
            })
        }

        else{

            // req.body.action === 1  =>  enable commenting
            if(req.body.action){
                post.commenting = true;
            }

            // req.body.action === 0  =>  disable commenting
            else post.commenting = false;

            let check = await post.save();
            if(!check){
                res.send({
                    err : true,
                    msg : `Changes not saved`
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
        res.send({
            err : true,
            msg : `try block failed`
        })
    }

})



// Delete Post
router.patch('/deleteRestore', async (req,res) => {

    try{

        let post = await Post.findOne({'_id' : req.body.p_id}, 'deleted');
        if(!post){
            res.send({
                err : true,
                msg : `Post not found`
            })
        }
        else{

            // req.body.action===1  =>  deleted    else    not deleted
            post.deleted = (req.body.action===1);

            let check = await post.save();
            if(!check){
                return res.send({
                    err : true,
                    nsg : `Couldn't complete the request`
                })
            }

            else{

                let user;
                if(post.deleted) user = await User.findOneAndUpdate({'_id' : req.body.owner_id}, { $inc : { 'postCount' : -1 } }, {useFindAndModify : false, new : true}).exec();
                else user = await User.findOneAndUpdate({'_id' : req.body.owner_id}, { $inc : { 'postCount' : 1 } }, {useFindAndModify : false, new : true}).exec();

                res.send({
                    err : false,
                    msg : `Done`
                })


            }

        }

    } catch (err){
        res.send({
            err : true,
            msg : `Try block failed`
        })
    }

})



// Edit a post
router.patch('/edit', async(req,res) => {

    try{

        let post = await Post.findOne({'_id' : req.body.p_id}, 'caption title location modifiedAt tagged hashTags');
        if(!post){
            res.send('Error');
        }

        else{

            

        }

    } catch(err){
        res.send(err);
    }

})





module.exports = router;