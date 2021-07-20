// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const commentSchema = new Schema({

    p_id : Schema.Types.ObjectId,
    u_id : Schema.Types.ObjectId,
    likes : {
        type : Number,
        default : 0
    },
    likedBy : [ Schema.Types.ObjectId ],
    timeStamp : Date,
    rComment : {
        type : Boolean,
        default : false
    },
    commentText : String,
    owner_id : Schema.Types.ObjectId,
    disabled : {
        type : Boolean,
        default : false
    },
    bComment : Boolean

}, { collection : 'comments' });


const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;