const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const pino = require('express-pino-logger')()
const logger = require('pino')()

/** 
 * Use Pino
*/
app.use(pino);

/** 
 * Use CORS
*/
app.use(require('cors')());

/**
 * Body parsing middlewares
 */
app.use(bodyParser.urlencoded({ 
    extended: false 
}));
app.use(bodyParser.json()); 

/** 
 * Routes
*/
// require('./routes/v1/message')(app);

/**
 * Server listener
 */
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info(`Server running at port ${port}`);
});
