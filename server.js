const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose')

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

const Message = mongoose.model('messages',{
  name : String,
  message : String,
  date : String,
})

const Login = mongoose.model('users', {
  username: String,
  password: String,
})

// //pass: U7sJsYp6cVQ217AW
// const dbUrl = "mongodb+srv://jayson:U7sJsYp6cVQ217AW@chatapp-hop1k.mongodb.net/chatapp?retryWrites=true&w=majority"
const defaultErrorResponse  = (err) => {
  return {
    status: false,
    message: 'Error: ['+err+']'
  }
}

app.post('/login', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  Login
    .findOne({username: username, password: password})
    .exec()
    .then((data) => {
      if( data != null ){
        res.send({
          status: true,
          message: 'Login Success',
          data: {
            id: data._id,
            username: data.username
          },
        })
      }else{
        res.send({
          status: false,
          message: 'Failed: Invalid username and password'
        })
      }
    })
    .catch((err) => {
      if( err ){
        res.send(defaultErrorResponse)
      }
    })
})

app.post('/signup', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  Login
    .find({username: username})
    .exec()
    .then((data) => {
      if( data.length > 0 ){
        res.send({
          status: false,
          message: 'Failed: Username exists.'
        })
      }else{
        Login(req.body).save()
        res.send({
          status: true,
          message: 'Successfully added new user.'
        })
      }
    })
    .catch((err) => {
      if( err ){
        res.send(defaultErrorResponse)
      }
    })
})

app.get('/fetchmessages', (req, res) => {
  Message
  .find({})
  .sort({ date: 1 })
  .then((data) => {
    res.send({
      status: true,
      data: data
    })
  })
  .catch((err) => {
    if( err ){
      res.send(defaultErrorResponse)
    }
  })
})

app.post('/messages', async (req, res) => {
  try{
    const message = new Message({
      name: req.body.name,
      message: req.body.message,
      date: Date.now()
    });
    const savedMessage = await message.save()
    io.emit('message', req.body);
    res.sendStatus(200);
  }catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }finally{
    console.log('Message Posted')
  }

})

io.on('connection', (socket) => {
  console.log('a user is connected')

  socket.on('messagedetection', async (sender,content) => {
    const message = new Message({
      name: sender,
      message: content,
      date: Date.now()
    })

    const savedMessage = await message.save()
    io.emit('message', message)
  })
})


const port = process.env.port || 3000
const appServer = http.listen(port, () => {
  console.log('server is running on port', appServer.address().port);
})

// mongoose.connect(process.env.MONGODB_URI ,{useNewUrlParser: true, useUnifiedTopology: true} ,(err) => {
//   console.log('mongodb connected',err);
// })

var mongodbUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || "mongodb+srv://jayson:U7sJsYp6cVQ217AW@chatapp-hop1k.mongodb.net/chatapp?retryWrites=true&w=majority"
mongoose.connect(mongodbUri, {useNewUrlParser: true, useUnifiedTopology: true}, () => {
  console.log('mongodb connected');
})

// const uri = `mongodb+srv://${process.env.DB_HOST}`;
// const options = {
//   user: process.env.DB_USER,
//   pass: process.env.DB_PASS,
//   dbName: process.env.DB_NAME,
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false,
//   useCreateIndex: true
// };
// mongoose.connect(uri, options).then(
//   _ => {
//     console.info('Database connection established');
//     http.listen(port, function() {
//       console.log(`listening on port ${port}`);
//     });
//   },
//   error => {
//     console.error('Database connection failed:', error);
//     throw new Error('Could not connect to the database');
//   }
// );