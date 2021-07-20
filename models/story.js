// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const storySchema = new Schema ({

    viewedBy : [ Schema.Types.ObjectId ],
    timeStamp : Date,
    viewType : {
        type : String,
        enum : [ 'closeFriends', 'all', 'followers' ],
    },
    u_id : Schema.Types.ObjectId,
    type : {
        questions : { type : Boolean, default : false },
        emojiSlider : { type : Boolean, default : false },
        poll : { type : Boolean, default : false },
        quiz : { type : Boolean, default : false },
        countdown : { type : Boolean, default : false },
        link : { type : Boolean, default : false }
    },
    details : [ { u_id : Schema.Types.ObjectId, response : String } ],
    mention : [ Schema.Types.ObjectId ],
    location : String,
    archived : {
        type : Boolean,
        default : false
    }, 
    music : String,
    link : String,
    sharedCount : {
        type : Number,
        default : 0
    },
    content : {  },
    deleted : {
        type : Boolean,
        default : false
    },
    disabled : {
        type : Boolean,
        default : false
    },
    insights : {
        profileVisits : { type : Number, default : 0 },
        impressions : { type : Number, default : 0 },
        follows : { type : Number, default : 0 },
        forward : { type : Number, default : 0 },
        exitted : { type : Number, default : 0 },
        next : { type : Number, default : 0 }
    }
}, { collection : 'stories' });


storySchema.index({ _id : 1, archived : 1, location : 1 });

const Story = mongoose.model('Story', storySchema);

module.exports = Story;