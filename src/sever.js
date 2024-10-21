const express = require('express');
const configViewEngine = require('./config/ViewEngine.js');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const connection = require('./config/database.js');
const { routerApi } = require('./routes/api.js');
const doLoginWGoogle = require('./controller/social/GoogleController.js');
const {app,server} = require('./socket/socket.js')
const bodyParser = require('body-parser');
const port = process.env.PORT || 8888;
var order = require('./routes/order');

// Configure request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key', // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Set to true if using HTTPS
  }));
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session()); // Enable passport session support
  
  // Configure CORS
  app.use(cors({
    origin: ['https://flash-card-fe-client.vercel.app', 'http://localhost:7070'],
    credentials: true,
  }));
  
  
  // Use your view engine configuration if rendering views
  configViewEngine(app);
  
  // API routes
  app.use('/', routerApi);
  app.use('/order', order);

//   app.use('/', ApiNodejs);
app.get("/", (req, res) => {
  res.json("Hello");
})  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  
  // Connect to the database and start the server
  (async () => {
    try {
      await connection();
      doLoginWGoogle();
      server.listen(port, '0.0.0.0', () => {
        console.log(`Backend app listening on http://0.0.0.0:${port}`);
      });
  
    } catch (error) {
      console.error("Error connecting to the database:", error);
    }
  })();
  