// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const hashtagSchema = new Schema({

    _id : String,
    posts : [ Schema.Types.ObjectId ]

}, { collection : 'hashTags' });

const Hashtag = mongoose.model('HashTag', hashtagSchema);

module.exports = Hashtag;