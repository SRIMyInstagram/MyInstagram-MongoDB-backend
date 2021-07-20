// requirements
const mongoose = require('mongoose');
const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const path = require('path');
const methodOverride = require('method-override');
const multer = require('multer');
const mongodb = require('mongodb');
const {GridFsStorage} = require('multer-gridfs-storage');
const crypto = require('crypto');
const Post = require('../models/post');



// express app setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));



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




// Sign Up
router.post(
    '/signup',
    [
        check('fullname', 'Please Enter Your Full Name Correctly').not().isEmpty(),
        check('username', 'Please Enter a Valid Username').not().isEmpty(),
        check('password', 'Please Enter a Valid Password').not().isEmpty()
    ],
    
    async (req,res) => {

        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.send({
                error : true,
                msg : errors.msg
            });
        }

        else{
            try{

                let user;

                // signing up with email
                if(req.body.email){
                    user = await User.findOne({ $or: [ {'username' : req.body.username}, {'email' : req.body.email} ] });
                }

                // signing up with phoneNo
                if(req.body.phoneNo){
                    user = await User.findOne({ $or: [ {'username' : req.body.username}, {'phoneNo' : req.body.phoneNo} ] });
                }

                // if a user with given username/email/phoneNo exits
                if(user) res.send({
                    err : true,
                    msg : 'User with given username/email/phoneNo already exists'
                });

                // if the credentials aren't already taken up
                else{

                    if(req.body.email){
                        user = new User({
                            createdAt : Date.now(),
                            fullname : req.body.fullname,
                            email : req.body.email,
                            username : req.body.username,
                            DOB : req.body.DOB,
                        });
                    }
                    else{
                        user = new User({
                            createdAt : Date.now(),
                            fullname : req.body.fullname,
                            phoneNo : req.body.phoneNo,
                            username : req.body.username,
                            DOB : req.body.DOB,
                        });
                    }
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(req.body.password, salt);
            
                    user.password = hashedPassword;
            
                    const check = await user.save();
                
                    // if saving the details failed
                    if(!check) {
                        res.send({
                            err : true,
                            msg : `Failed to complete signup process`
                        });
                    }

                    // successfully completed the signup process
                    else{
                        res.send({
                            err : false,
                            value : user
                        });
                    }
                }
            } catch (err) {
                console.log(err);
                res.send({
                    err : true,
                    msg : err.message
                });
            }
        }
    });




// Login
router.post(
    '/login', 
    [
        check('password', 'Please Enter a Valid Password').not().isEmpty()
    ],

    async (req,res) => {

        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.send({
                error : true,
                msg : errors.msg
            });
        }

        else{
            try{

                let user;

                // if logging in using username
                if(req.body.username){
                    user = await User.findOne({ 'username' : req.body.username});
                }

                // if logging in using email
                else if(req.body.email){
                    user = await User.findOne({ 'email' : req.body.email});
                }

                // if logging in using phone no
                else if(req.body.phoneNo){
                    user = await User.findOne({ 'phoneNo' : req.body.phoneNo});
                }

                // if user not found
                if(!user){
                    return res.send({
                        err : true,
                        msg : `Invalid login credentials`
                    })
                }

                // user found
                else{

                    const isValidPassword = await bcrypt.compare(req.body.password, user.password);
                    
                    // if password doesn't match
                    if(!isValidPassword) {  
                        return res.send({
                            error : true,
                            msg : 'Incorrect Password'
                        });
                    }
                    else {
                        res.send({
                            err : false,
                            value : user
                        });
                    }

                }
            } catch (err) {
                console.log(err);
                res.send({
                    err : true,
                    msg : err.message
                });
            }   
        }
    });




// Update Profile
router.patch(
    '/updateProfile',
    [
        check('_id', 'object not sent properly').not().isEmpty()
    ],

    async (req, res) => {

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.send({
                err : true,
                msg : errors
            })
        }

        else{

            try{

                let user = await User.findOne({'_id' : req.body._id});
                
                if(user.account){

                    let flag = false;

                    // if updated username
                    if(req.body.username && !(user.username === req.body.username)){

                        let check = await User.findOne({'username' : req.body.username});
                        if(check && check._id!=req.body._id){
                            flag = true;
                            return res.send({
                                err : true,
                                msg : `username already exists`
                            });
                        }
                        else if(!check){
                            user.username = req.body.username;
                        }

                    }

                    // if updated email
                    if(req.body.email && !(user.email === req.body.email)){

                        let check  = await User.findOne({'email' : req.body.email});
                        if(check && check._id!=req.body._id){
                            flag = true;
                            return res.send({
                                err : true,
                                msg : `email is already linked with another account`
                            });
                        }
                        else if(!check){
                            user.email = req.body.email;
                        }

                    }

                    // if updated phoneNo
                    if(req.body.phoneNo && !(user.phoneNo === req.body.phoneNo)){

                        let check = await User.findOne({'phoneNo' : req.body.phoneNo});
                        if(check && check._id!=req.body._id){
                            flag = true;
                            return res.send({
                                err : true,
                                msg : `phone number is already linked with another account`
                            });
                        }
                        else if(check){
                            user.phoneNo = req.body.phoneNo;
                        }

                    }

                    // if updated DOB
                    if(req.body.DOB && !(user.DOB === req.body.DOB)){
                        user.DOB = req.body.DOB;
                    }

                    // if updated bio
                    if(req.body.bio && !(user.bio === req.body.bio)){
                        user.bio = req.body.bio;
                    }

                    // if updated website
                    if(req.body.website && !(user.website === req.body.website)){
                        user.website = req.body.website;
                    }

                    // if updated gender
                    if(req.body.gender && !(user.gender === req.body.gender)){
                        user.gender = req.body.gender;
                    }

                    // if updated name
                    if(req.body.fullname && !(user.fullname === req.body.fullname)){
                        user.fullname = req.body.fullname;
                    }


                    // Safe-check
                    let confirm;
                    if(!flag) confirm = await user.save();
                    if(!confirm){
                        return res.send({
                            err : true,
                            msg : `Oops! An error occured... Try again in some time`
                        });
                    }
                    else{
                        return res.send(confirm);
                    }

                }

                else{
                    return res.send({
                        err : true,
                        msg : `account is disabled`
                    })
                }
            } catch (err){
                console.log(err);
                return res.send({
                    err : true,
                    msg : err.message
                });
            }

        }

    });



// Update profilePicture
router.post('/profilePicture', upload.single('media'), async (req,res) => {
    
    let t = true;

    try{

        let user = await User.findOne({'_id' : req.body.u_id});
        let flag = false;
        if(!user && t){
            flag = true;
            t = false;
            return res.send({
                err : true,
                msg : `Oops! An error occured`
            })
        }

        // if the user already had a profile picture
        else if(user && user.profilePicture){
            let obj_id = new mongoose.Types.ObjectId(user.profilePicture);
            gfs.delete(obj_id);
        }


        // saving the new refernce
        if(user) user.profilePicture = req.file.id;


         // Safe-check
         let check;
         if(user) check = await user.save();
         if(!check && user && t) {
             t = false;
             res.send({
                 err : true,
                 msg : `Oops! An error occured`
             });
         }

        else if(!flag && user && t){
            res.send({
                err : false,
                msg : `Done!`
            })
        }
    } catch(err) {
        console.error(err);
        res.send({
            err: true
        })
    }
})



// Remove profilePicture
router.delete('/removeProfilePicture', (req,res) => {

    let obj_id = new mongoose.Types.ObjectId(req.body.profilePicture);
    gfs.delete(obj_id);

    let check = User.findOneAndUpdate({_id: req.body.u_id}, {$unset: {profilePicture: 1 }}, {useFindAndModify : false, new : true}).exec();

    res.send({
        msg : `Done!`
    });

})



// User 1 blocks/unblocks User 2
router.post('/blockUnblock', async (req,res) => {

    try{

        // req.body.action === 1  =>  User1 blocked User2
        if(req.body.action){

            let flag = false;

            let user1 = await User.findOne({'_id' : req.body.user1_id}, 'following followers blockedUsers');
            
            // Safe-check
            if(!user1){
                flag = true;
                res.send({
                    msg : `Oops! An error occured`
                });
            }
            
            else{

                // adding user2 to user1's blockedUsers[]
                user1.blockedUsers.push(req.body.user2_id);

                // removing user2 from user1's following[] if present
                user1.following.pull(req.body.user2_id);

                // removing user2 from user1's followers[] if present
                user1.followers.pull(req.body.user2_id);

            }



            let user2 = await User.findOne({'_id' : req.body.user2_id}, 'following followers blockedFrom');
            
            // Safe-check
            if(!user2){
                flag = true;
                res.send({
                    msg : `Oops! An error occured`
                });
            }

            else{

                // adding user1 to user2's blockedFrom[]
                user2.blockedFrom.push(req.body.user1_id);

                // removing user1 from user2's following[]
                user2.following.pull(req.body.user1_id);

                // remove user1 from user2's followers[]
                user2.followers.pull(req.body.user1_id);

            }

            // checking successful completion of both the tasks
            if(!flag){

                // Saving user1
                let check = await user1.save();

                // Safe-check
                if(!check){
                    flag = true;
                    return res.send({
                        err : true,
                        msg : `An error occured`
                    })
                }

                else{

                    // Saving user2
                    if(!flag) check = await user2.save();

                    // Safe-check
                    if(!check){
                        return res.send({
                            err : true,
                            msg : `An error occured`
                        })
                    }

                    // Query executed uccessfully
                    else{
                        res.send({
                            err : false,
                            msg : `Done!`
                        })
                    }
                }

            }

            // one of the findOne queries failed
            else{
                res.send({
                    err : true,
                    msg : `An error occured`
                })
            }

        }

        // req.body.action === 0  =>  Unblock
        else{

            let flag = false;

            let user1 = await User.findOne({'_id' : req.body.user1_id}, 'blockedUsers');

            // Safe-check
            if(!user1){
                flag = true;
                res.send({
                    msg : `Oops! An error occured`
                });
            }

            else{

                // removing user2 from user1's blockedUsers[]
                user1.blockedUsers.pull(req.body.user2_id);

            }

            let user2 = await User.findOne({'_id' : req.body.user2_id}, 'blockedFrom');

            // Safe-check
            if(!user2){
                flag = true;
                res.send({
                    msg : `Oops! An error occured`
                });
            }

            else{

                // removing user1 from user2's blockedFrom[]
                user2.blockedFrom.pull(req.body.user1_id);

            }

            // checking successful completion of both the tasks
            if(!flag){

                // Saving user1
                let check = await user1.save();

                // Safe-check
                if(!check){
                    flag = true;
                    return res.send({
                        err : true,
                        msg : `An error occured`
                    })
                }

                else{

                    // Saving user2
                    if(!flag) check = await user2.save();

                    // Safe-check
                    if(!check){
                        return res.send({
                            err : true,
                            msg : `An error occured`
                        })
                    }

                    // Query executed uccessfully
                    else{
                        res.send({
                            err : false,
                            msg : `Done!`
                        })
                    }
                }

            }

            // one of the findOne queries failed
            else{
                res.send({
                    err : true,
                    msg : `An error occured`
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



// User1 follows/unfollows User2
router.post('/followUnfollow', async (req,res) => {

    try{

        // req.body.action === 1  =>  follow
        if(req.body.action){

            let user2 = await User.findOne({'_id' : req.body.user2_id}, 'accountType followers requests');
            
            if(!user2){
                res.send({
                    err : true,
                    msg : `An error occured`
                })
            }

            else{
                let flag = false;
                if(!user2.accountType){
                    user2.requests.push(req.body.user1_id);
                }
                else{
                    user2.followers.push(req.body.user1_id);

                    let user1 = await User.findOne({'_id' : req.body.user1_id}, 'following');

                    if(!user1){
                        flag = true;
                        res.send({
                            err : true,
                            msg : `An error occured`
                        })
                    }

                    else{
                        user1.following.push(req.body.user2_id);
                    }

                    let check = await user1.save();

                    if(!check){
                        flag = true;
                        return res.send({
                            err : true,
                            msg : `An error occured`
                        })
                    }

                }

                let check;
                if(!flag) check = await user2.save();

                if(!check){
                    return res.send({
                        err : true,
                        msg : `An error occured`
                    })
                }

                else{
                    res.send({
                        msg : `Done`
                    })
                }
            }
        }

        // req.body.action === 0  =>  unfollow
        else{
            
            let user1 = await User.findOne({'_id' : req.body.user1_id}, 'following');
            if(!user1){
                res.send({
                    err : true,
                    msg : `An error occured`
                })
            }

            user1.following.pull(req.body.user2_id);

            let user2 = await User.findOne({'_id' : req.body.user2_id}, 'followers');
            if(!user2){
                res.send({
                    err : true,
                    msg : `An error occured`
                })
            }

            user2.followers.pull(req.body.user1_id);

            let check = await user1.save();
            if(!check){
                return res.send({
                    msg : `err`
                })
            }
            else{
                check = await user2.save();
                if(!check){
                    return res.send({
                        msg : `err`
                    })
                }
                else{
                    res.send({
                        msg : `done`
                    })
                }
            }
            

        }

    } catch(err){
        res.send({
            err : true,
            msg : `try block failed`
        });
    }

})




// Change profile visibility
router.patch('/visibility', async (req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'accountType');

        if(!user){
            res.send({
                err : true,
                msg : `User not found`
            })
        }

        else{

            // if req.body.action === 1  => public       else =>  private
            user.accountType = (req.body.action===1);

            let check = await user.save();

            if(!check){
                res.send({
                    err : true,
                    msg : `Error occured`
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
            msg : `Try block failed`
        })
    }

})




// View saved posts
router.get('/savedPosts', async(req,res) => {

    try{

        // finding user's savedPosts[]
        let user = await User.findOne({'_id' : req.body.u_id}, 'savedPosts');
        
        // Safe-check
        if(!user){
            return res.send({
                err : true,
                msg : `User not found`
            })
        }

        else{

            let savedPosts = user.savedPosts;
            let l = savedPosts.length;

            // if there are no posts saved by the user
            if(l===0) return res.send({err : false, msg : `none`});

            else{

                // final output array
                let value = [];

                // will contain the content of the post's that should be returned 
                let valid = [];

                // A loop for filtering out the valid posts out of all the ones saved by the user
                for(let i=0; i<l; i++){
                    let tempPost = await Post.findOne({ '_id' : savedPosts[i], 'deleted' : false, 'archived' : false, 'disabled' : false }, '_id content u_id');

                    // adding it to the valid[]
                    if(tempPost) valid.push(tempPost);
                }

                l = valid.length;
                if(l===0) return res.send({err : false, msg : `none`});
                else{

                    // adding content of each post of the valid[] to value[] along with the post owner's accountType
                    for(let i=0; i<l; i++){
                        let tempValue = [];
                        let tempUser = await User.findOne({'_id' : valid[i].u_id}, 'accountType');

                        if(tempUser){
                            tempValue.push(tempUser);
                            tempValue.push(valid[i]._id);
                            var readstream = gfs.openDownloadStreamByName(valid[i].content[0]);
                            // console.log(readstream);

                            let chunks = [];
                            readstream.on('data', data => {
                                chunks.push(data);
                            });
                            readstream.on('end', () => {
                                let data = Buffer.concat(chunks);
                                tempValue.push(data);
                                value.push(tempValue);
                                if(i==l-1) res.send({
                                    err : false,
                                    msg : value
                                })
                            });
                        }
                    }
                }

            }
        }
    } catch (err){
        console.log(err);
        res.send({
            err : true,
            msg : `Try catch blocked`
        })
    }

})




// View posts a user (someone else/himself/herself) is taggedIn
router.get('/taggedInPosts', async(req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'taggedIn');

        if(!user) {
            return res.send({
                err : true,
                msg : `User not found`
            })
        }
        else{

            let taggedIn = user.taggedIn;
            let l = taggedIn.length;

            if(l===0) return res.send({err : false, msg : `none`});

            else{

                // final output array
                let value = [];

                // will store all the valid posts
                let valid = [];

                for(let i=0; i<l; i++){

                    let post = await Post.findOne({'_id' : taggedIn[i], 'deleted' : false, 'archived' : false, 'disabled' : false}, '_id content u_id');

                    // if such a post exists, add it to valid[]
                    if(post) valid.push(post);
                }

                l = valid.length;
                if(l===0) return res.send({err : false, msg : `none`});

                else{

                    for(let i=0; i<l; i++){
                        let tempValue = [];
                        let tempUser = await User.findOne({'_id' : valid[i].u_id}, 'accountType');

                        if(tempUser){
                            tempValue.push(tempUser);
                            tempValue.push(valid[i]._id);

                            var readstream = gfs.openDownloadStreamByName(valid[i].content[0]);
                            // console.log(readstream);

                            let chunks = [];
                            readstream.on('data', data => {
                                chunks.push(data);
                            });
                            readstream.on('end', () => {
                                let data = Buffer.concat(chunks);
                                tempValue.push(data);
                                value.push(tempValue);
                                if(i==l-1) res.send({
                                    err : false,
                                    msg : value
                                })
                            });
                        }
                    }
                }
            }

        }

    } catch(err){
        res.send(err);
    }

})




// View posts I've Liked
router.get('/postsLiked', async (req, res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'liked');

        if(!user){
            res.send({
                err : true,
                msg : `An error`
            })
        }

        else{

            let liked = user.liked;
            let l = liked.length;

            if(l===0) return res.send({err : false, msg : `none`});

            else{
                // storage for the final output
                let value = [];

                // to keep track of the posts to be returned along with the post's owner_id's accountType
                let valid = [];

                
                for(let i=0; i<l; i++){

                    let post = await Post.findOne({'_id' : liked[i], 'deleted' : false, 'archived' : false, 'disabled' : false}, '_id content u_id');
                    if(post) valid.push(post);

                }

                l = valid.length;
                if(l===0) return res.send({err : false, msg : `none`});

                else{
                    for(let i=0; i<l; i++){

                        let tempValue = [];
                        let tempUser = await User.findOne({'_id' : valid[i].u_id}, 'accountType');

                        if(tempUser){
                            tempValue.push(tempUser);
                            tempValue.push(valid[i]._id)

                            var readstream = gfs.openDownloadStreamByName(valid[i].content[0]);
                            // console.log(readstream);

                            let chunks = [];
                            readstream.on('data', data => {
                                chunks.push(data);
                            });
                            readstream.on('end', () => {
                                let data = Buffer.concat(chunks);
                                tempValue.push(data);
                                value.push(tempValue);
                                if(i==l-1) res.send({
                                    err : false,
                                    msg : value
                                })
                            });
                        }
                    }

                }
            }

        }

    } catch (err){
        return res.send(err);
    }

})



// View posts I've Archived
router.get('/archivedPosts', async (req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'posts');

        if(!user){
            return res.send({
                err : true,
                msg : `User not found`
            })
        }

        else{

            let posts = user.posts;
            let  l = posts.length;

            if(l===0) return res.send({err : false, msg : `none`});

            else{

                // storage for final output
                let value = [];

                // storage to keep the valid return values marked
                let valid = [];

                for(let i=0; i<l; i++){
                    let post = await Post.findOne({'_id' : posts[i], 'deleted' : false, 'archived' : true}, '_id content');
                    if(post) valid.push(post);
                }

                l = valid.length;
                if(l===0) return res.send({err : false, msg : `none`});

                else{
                    
                    for(let i=0; i<l; i++){

                        let tempValue = [];
                        tempValue.push(valid[i]._id);

                        var readstream = gfs.openDownloadStreamByName(valid[i].content[0]);
                        // console.log(readstream);

                        let chunks = [];
                        readstream.on('data', data => {
                            chunks.push(data);
                        });
                        readstream.on('end', () => {
                            let data = Buffer.concat(chunks);
                            tempValue.push(data);
                            value.push(tempValue);
                            if(i==l-1) res.send({
                                err : false,
                                msg : value
                            })
                        });

                    }

                }
            }

        }

    } catch (err){
        res.send(err);
    }

})



// Switch Account Type
router.patch('/switchType', async(req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'accountType2 accountType followers requests');

        if(!user){
            return res.send({
                err : true,
                msg : `user not found`
            })
        }

        else{
            user.accountType2 = req.body.accountType2;
            user.accountType = true;

            let requests = user.requests;
            let l = requests.length;

            if(l===0){
                let check2 = await user.save();
                if(!check2){
                    return res.send({
                        err : true,
                        msg : `Unable to update user`
                    })
                }
    
                else{
                    res.send({
                        err : false,
                        msg : `Done!`
                    })
                }
            }

            else{
                for(let i=0; i<l; i++){

                    let tempUser = await User.findOne({'_id' : requests[i]}, 'following');
                    if(tempUser){
                        tempUser.following.push(req.body.u_id);
                        user.followers.push(requests[i]);

                        let check = await tempUser.save();
                        if(!check){
                            return res.send({
                                err : true,
                            })
                        }

                        if(i===l-1){
                            user.requests=[];
                            let check2 = await user.save();
                            if(!check2){
                                return res.send({
                                    err : true,
                                    msg : `Unable to update user`
                                })
                            }
                
                            else{
                                res.send({
                                    err : false,
                                    msg : `Done!`
                                })
                            }
                        }
                    }

                }
            }
        }

    } catch(err){
        res.send(err);
    }

})



// Block/Unblock a particular user from commenting
router.patch('/bufc', async(req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.user1_id}, 'blockedUserFromComment');
        if(!user){
            res.send({
                err : true,
                msg : `An error occurred`
            })
        }

        else{
            if(req.body.action===1) user.blockedUserFromComment.push(req.body.user2_id);
            else user.blockedUserFromComment.pull(req.body.user2_id);

            let check = await user.save();
            if(!check){
                return res.send({
                    err : true,
                    msg : `Unable to update right now`
                })
            }
            else{
                res.send(check);
            }
        }

    } catch(err){
        res.send(err);
    }

})



// update checkComment from u_id
router.patch('/checkComment', async(req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'checkComment');
        if(!user){
            return res.send({
                err : true,
                msg : `User cannot be found`
            })
        }

        else{
            user.checkComment = (req.body.checkComment===1);

            let check = await user.save();
            if(!check){
                return res.send({
                    err : true,
                    msg : `Error occurred`
                })
            }
            else{
                res.send(check);
            }
        }

    } catch(err){
        res.send(err);
    }

})




// Update allowCommentsFrom for u_id
router.patch('/updateACF', async(req,res) => {

    try{

        let check = await User.findOneAndUpdate({'_id' : req.body.u_id}, {'allowCommentFrom' : req.body.action}, {new : true, useFindAndModify : false});
        if(!check){
            res.send({
                err : true,
                msg : `Error`
            })
        }
        else{
            res.send(check);
        }

    } catch(err){
        res.send(err);
    }

})



// update offensive comments 
router.patch('/offensiveWords', async(req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'offensiveWords');

        if(!user){
            res.send({
                err : true,
                msg : `Error occurred`
            })
        }

        else{
            
            let offensiveWords = user.offensiveWords;

            req.body.deleted.forEach(element => {
                
                let index = offensiveWords.indexOf(element);
                if(index>-1) offensiveWords.splice(index,1);

            });

            req.body.inserted.forEach(element => {
                offensiveWords.push(element);
            });

            user.offensiveWords = offensiveWords;

            let check = await user.save();

            if(!check){
                res.send('Error');
            }

            else res.send(check);

        }

    } catch(err){
        res.send(err)
    }

})



// enable/disable activity status
router.patch('/activityStatus', async(req,res) => {

    try{

        let activity = (req.body.action===1);

        let check = await User.findOneAndUpdate({'_id' : req.body.u_id}, {'activity' : activity}, {new : true, useFindAndModify : false});
        if(!check){
            res.send({
                err : true,
                msg : `Error`
            })
        }
        else {
            res.send(check)
        }

    } catch(err){
        res.send(err)
    }

})



// View Search History
router.get('/searchHistory', async(req,res) => {

    try{

        let value = await User.findOne({'_id' : req.body.u_id}, 'searchHistory');
        if(!value){
            res.send('Error');
        }
        else res.send(value);

    } catch(err){
        res.send(err);
    }

})



// View deleted posts
router.get('/deleted', async(req,res) => {

    try{

        let user = await User.findOne({'_id' : req.body.u_id}, 'posts');
        if(!user){
            res.send('Error');
        }
        else{

            let l = user.posts.length;

            if(l===0) return res.send('none');
            else{
                let valid = [];
                for(let i=0; i<l; i++){

                    let post = await Post.findOne({'_id' : user.posts[i], 'deleted' : true}, '_id content');
                    if(post) valid.push(post);

                }

                l = valid.length;
                if(l===0) return res.send('none');

                else{

                    let value = [];

                    for(let i=0; i<l; i++){
                        let tempValue = [];
                        tempValue.push(valid[i]._id);

                        var readstream = gfs.openDownloadStreamByName(valid[i].content[0]);
                        // console.log(readstream);

                        let chunks = [];
                        readstream.on('data', data => {
                            chunks.push(data);
                        });
                        readstream.on('end', () => {
                            let data = Buffer.concat(chunks);
                            tempValue.push(data);
                            value.push(tempValue);
                            if(i==l-1) res.send({
                                err : false,
                                msg : value
                            })
                        });
                    }

                }
            }
        }

    } catch(err){
        res.send(err);
    }

})





module.exports = router;