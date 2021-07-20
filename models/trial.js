// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const trial = new Schema({
    name : String,
    age : Number,
    pets : Schema.Types.ObjectId
});

const trials = mongoose.model('trialer', trial);

module.exports = trials;