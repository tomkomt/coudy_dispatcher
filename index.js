const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const pino = require('express-pino-logger')()
const logger = require('pino')()
const fileUpload = require('express-fileupload');

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
 * Allow files upload
*/
app.use(fileUpload());

/** 
 * Use routes
*/
require('./routes/v1/mobile')(app);
require('./routes/v1/simulator')(app);

/**
 * Server listener
 */
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info(`Server running at port ${port}`);

    logger.info(`Starting to fetch movies to redux`);
    require('./redux/store').dispatch(require('./redux/movies/actions').fetchMovies());
});