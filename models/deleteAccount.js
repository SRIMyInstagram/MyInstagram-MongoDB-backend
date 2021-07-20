// requirements
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const deleteSchema = new Schema ({
    
    u_id : Schema.Types.ObjectId,

}, { collection : 'deleteAccounts' });


const DeleteAccount = mongoose.model('DeleteAccount', deleteSchema);

module.exports = DeleteAccount;