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
const uploadCloud = require('./config/cloudinaryConfig.js');
const { sendMail } = require('./config/mailSendConfig.js');
// const app = express();
const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME || 'localhost';

// Configure request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key', // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session()); // Enable passport session support
  
  // Configure CORS
  app.use(cors({
    origin: 'http://localhost:7070',
    credentials: true,
  }));
  
  // Use your view engine configuration if rendering views
  configViewEngine(app);
  
  // API routes
  app.use('/', routerApi);
//   app.use('/', ApiNodejs);
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  
  // Connect to the database and start the server
  (async () => {
    try {
      await connection();
      doLoginWGoogle();
      // sendMail("trungthanhle2004@gmail.com","This is CUong","con cac thanh den xi")
      server.listen(port, hostname, () => {
        console.log(`Backend app listening on http://${hostname}:${port}`);
      });
  
    } catch (error) {
      console.error("Error connecting to the database:", error);
    }
  })();
  