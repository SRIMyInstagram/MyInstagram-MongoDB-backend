// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const verificationSchema = new Schema({
    
    u_id : Schema.Types.ObjectId,
    fullname : String,
    knownAs : String,
    category : String,
    image : String,
    status : {
        type : String,
        enum : [ 'posted', 'viewed', 'underVerification', 'approved', 'declined' ],
        default : 'posted'
    }
    
}, { collection : 'requestsForVerification' });

const RequestForVerification = mongoose.model('RequestForVerification', verificationSchema);

module.exports = RequestForVerification;