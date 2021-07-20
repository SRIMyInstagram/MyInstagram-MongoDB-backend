// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const liveSchema = new Schema({

    video : Schema.Types.ObjectId,
    timeStamp : Date,
    u_id : Schema.Types.ObjectId

}, { collection : 'liveVideos' });


const LiveVideos = mongoose.model('LiveVideos', liveSchema);