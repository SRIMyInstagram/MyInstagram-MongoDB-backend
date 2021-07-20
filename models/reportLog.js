// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const reportLogSchema = new Schema ({

    object_id : Schema.Types.ObjectId,
    entity : {
        type : String,
        enum : [ 'post', 'profile', 'story', 'comment' ]
    }

}, { collection : 'reportLogs' });

const ReportLog = mongoose.model('ReportLog', reportLogSchema);

module.exports = ReportLog;