const unirest = require('unirest');
const Immutable = require('immutable');
const configParams = Immutable.fromJS(require('../../config.dev.json'));
const logger = require('pino')();
const _ = require('lodash');

var pendingRequest = false;
function blockRequests() {
    pendingRequest = true;
}
function allowRequests() {
    pendingRequest = false;
}

function fetchMovies() {
    try {
        if(!pendingRequest) {
            pendingRequest = true;
            return (dispatch) => {
                return unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
                .headers({
                    'Content-Type': 'application/json'
                })
                .send({
                    "jsonrpc": "2.0",
                    "method": "VideoLibrary.GetMovies",
                    "params": {
                        "properties": ["file"]
                    },
                    "id": 1
                })
                .end((response) => {
                    if(_.get(response, 'status') == 200) {
                        let response_body = _.get(response, 'body');
                        let movies_list = _.get(response_body, ['result', 'movies']);
                        allowRequests();
                        dispatch(addMovies(movies_list));
                    } else {
                        logger.error(response.message);
                        allowRequests();
                        dispatch(receiveNothing());
                    }
                })
            }
        } else {
            return (dispatch) => {
                allowRequests();
                dispatch(receiveNothing());
            };
        }
    } catch(error) {
        logger.error(error.message);
        return (dispatch) => {
            allowRequests();
            dispatch(receiveNothing());
        };
    }    
}

function receiveNothing() {
    return {
        type: 'REQUEST_BLOCKED'
    };
}

function addMovies(moviesList) {
    return {
        type: require('./consts').ADD_MOVIES,
        moviesList: moviesList
    }
}

module.exports = {
    fetchMovies: fetchMovies,
    addMovies: addMovies
}