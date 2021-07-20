//  requirements
const mongoose = require('mongoose');
const express = require('express');
const User = require('./models/user');
const Post = require('./models/post');
const router = express.Router();
const trial = require('./models/trial');
const cors = require('cors');
const path = require('path')



// connection string, connection establishment
mongoose.connect('mongodb://localhost:27017/MyInstagram', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});


// connection establishment check
const db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error'));
db.once('open', ()=>{
    console.log('connected');
});



// express-app setup
const app = express();


// body-parser
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());



// view setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')



// port establishment
const port = 3000;



// Routes
app.use('/user', require('./routes/user'));
app.use('/post', require('./routes/post'));
app.use('/comment', require('./routes/comment'));
app.use('/reportLog', require('./routes/reportLog'));
app.use('/hashtags', require('./routes/hashtags'));
app.use('/rfv', require('./routes/requestForVerification'));

app.post('/new', async(req,res) =>  {
    let entry = new trial({
        name : req.body.name,
        age : req.body.age
    })

    let check = await entry.save();
    if(!check) return res.send('err');
    else return res.send('done');
})



// index route
app.get('/', async(req,res) => {
    res.render('index', {
        people : [
            {name : 'sanket'},
            {name : 'mihir'}
        ]
    });
})




// listening to the port
app.listen(port, () => {
    console.log(`App is listening at http://localhost:${port}`);
});