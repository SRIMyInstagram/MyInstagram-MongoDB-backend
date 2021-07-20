// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const logSchema = new Schema ({

    u_id : Schema.Types.ObjectId,
    timeStamp : Date,
    details : { attribute:String, value:String },
    activityRelated : Boolean

}, { collection : 'logs' });

const Logs = mongoose.model('Logs', logSchema);

module.exports = Logs;