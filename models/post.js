// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const postSchema = new Schema({

    u_id : Schema.Types.ObjectId,
    createdAt : Date,
    modifiedAt : Date,
    caption : {
        type : String,
        maxLength : 2200
    },
    location : String,
    tagged : [{u_id : Schema.Types.ObjectId, status : { type : String, enum : ['enabled', 'disabled']} }],
    type : {
        type : String,
        enum : [ 'reel', 'post', 'igtv' ]
    },
    likes : {
        type : Number,
        default : 0
    },
    likedBy : [ Schema.Types.ObjectId ],
    savedCount : {
        type : Number,
        default : 0
    },
    hashTags : [ String ],
    deleted : {
        type : Boolean,
        default : false
    },
    commenting : {
        type : Boolean,
        default : false
    },
    archived : {
        type : Boolean,
        default : false
    },
    count : {
        type : Boolean,
        default : false
    },
    title : String,
    content : [ String ],
    music : String,
    sharedCount : {
        type : Number,
        default : 0
    },
    disabled : {
        type : Boolean,
        default : false
    },
    insights : {
        profileVisits : {type : Number, default : 0},
        follows : {type : Number, default : 0},
        impressions : {type : Number, default : 0}
    }
}, { collection : 'posts' });


postSchema.index({ _id : 1, archived : 1, deleted : 1 });
const Post = mongoose.model('Post', postSchema);

module.exports = Post;