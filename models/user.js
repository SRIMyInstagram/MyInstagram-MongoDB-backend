// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const userSchema = new Schema ({

    createdAt : Date,
    fullname : String,
    email : String,
    phoneNo : String,
    username : {
        type : String,
        maxLength : 30
    },
    language : {
        type : String,
        default : 'en-US',
        maxLength : 50
    },
    password : {
        type : String
    },
    DOB : String,
    gender : {
        type : String,
        default : 'Prefer Not To Say',
        maxLength : 60
    },
    tokenVersion :{
        type : Boolean,
        default : false
    },
    blockedUsers : [ Schema.Types.ObjectId ],
    savedPosts : [ Schema.Types.ObjectId ],
    followers : [ Schema.Types.ObjectId ],
    following : {
        type : [ Schema.Types.ObjectId ],
        maxLength : 7500
    },
    hashtags : [ String ],
    accountType : {
        type : Boolean,
        default : true
    },
    accountType2 : {
        type : String,
        enum : [ 'normal', 'business', 'professional' ],
        default : 'normal'
    },
    requests : [ Schema.Types.ObjectId ],
    taggedIn : [ Schema.Types.ObjectId ],
    liked : [ Schema.Types.ObjectId ],
    account : {
        type : Boolean,
        default : true
    },
    verified : {
        type : Boolean,
        default : false
    },
    blockUserFromComment : [ Schema.Types.ObjectId ],
    manuallyApproveTags : {
        type : Boolean,
        default : false
    },
    toConfirmTag : [ Schema.Types.ObjectId ],
    allowTagsFrom : {
        type : String,
        enum : [ 'all', 'none', 'following' ],
        default : 'all'
    },
    likeViewCount : {
        type : Boolean,
        default : true
    },
    allowCommentFrom : {
        type : String,
        enum : [ 'everyone', 'following', 'followers', 'followingFollowers' ],
        default : 'everyone'
    },
    checkComment : {
        type : Boolean,
        default : false
    },
    offensiveWords : [ String ],
    hideStory : [ Schema.Types.ObjectId ],
    allowAtMention : {
        type : String,
        enum : [ 'all', 'none', 'following' ],
        default : 'all'
    },
    closeFriends : [ Schema.Types.ObjectId ],
    allowToShareOnStory : {
        type : Boolean,
        default : true
    },
    muteStories : [ Schema.Types.ObjectId ],
    mutePosts : [ Schema.Types.ObjectId ],
    manageNotification : { posts : [ Schema.Types.ObjectId ], stories : [ Schema.Types.ObjectId ], igtv : [ Schema.Types.ObjectId ], Reels : [ Schema.Types.ObjectId ], liveVideos : { all : [ Schema.Types.ObjectId ], some : [ Schema.Types.ObjectId ], none : [ Schema.Types.ObjectId ] } },
    highlight : [ { title : String, stories : [ Schema.Types.ObjectId ], cover : Schema.Types.ObjectId } ],
    isMentionedIn : [ Schema.Types.ObjectId ],
    storyArchive : {
        type : Boolean,
        default : true
    },
    liveArchive : {
        type : Boolean,
        default : true
    },
    restictAccounts : [ Schema.Types.ObjectId ],
    NPS : [ Schema.Types.ObjectId ],
    countdown : [ Date ],
    profilePicture : String,
    bio : {
        type : String,
        maxLength : 200
    },
    website :{
        type : String,
        maxLength : 60
    },
    postCount : {
        type : Number,
        default : 0
    },
    blockedFrom : [ Schema.Types.ObjectId ],
    guides : [ { title : String, description : String, cover : Schema.Types.ObjectId, posts : [ { title : String, description : String, post_id : Schema.Types.ObjectId } ] } ],
    hideFromProfileGrid : [ Schema.Types.ObjectId ],
    posts : [ Schema.Types.ObjectId ],
    stories : [ Schema.Types.ObjectId ],
    recentStory : [ Schema.Types.ObjectId ],
    searchHistory : [ String ]

}, { collection : 'users' });


userSchema.index({ username : 1 });
userSchema.index({ phoneNo : 1 });
userSchema.index({ email : 1 });
// userSchema.index({  })
const User = mongoose.model('User', userSchema);

module.exports = User;