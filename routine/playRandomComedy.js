const Immutable = require('immutable');
const _ = require('lodash');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const logger = require('pino')()
const unirest = require('unirest');
const series = require('async/series')

module.exports = () => {
    return new Promise((resolve, reject) => {
        var selected_movie = {}

        series([
            (callback) => {
                unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
                .headers({
                    'Content-Type': 'application/json'
                })
                .send({
                    "jsonrpc": "2.0",
                    "method": "VideoLibrary.GetMovies",
                    "params": {
                        "properties": ["year", "genre", "ratings"],
                        "filter": {
                            "genre": "Comedy"
                        }
                    },
                    "id": 1
                })
                .end((response) => {
                    if(_.get(response, 'status') == 200) {
                        let response_body = _.get(response, 'body');
                        let movies_list = _.get(response_body, ['result', 'movies']);
                        selected_movie = _
                            .chain(movies_list)
                            .filter(item => {
                                return _.get(item, 'year') > 1990;
                            })
                            .filter(item => {
                                return _.has(item, ['ratings', 'themoviedb', 'rating']);
                            })
                            .filter(item => {
                                return _.get(item, ['ratings', 'themoviedb', 'votes']) > 50;
                            })
                            .filter(item => {
                                return _.get(item, ['ratings', 'themoviedb', 'rating']) > 5.9;
                            })
                            .orderBy(['ratings.themoviedb.rating'], ['desc'])
                            .shuffle()
                            .head()
                            .value()
                        callback(null, selected_movie);
                    } else {
                        callback(response.error)
                    }
                })
            },
            (callback) => {
                unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
                .headers({
                    'Content-Type': 'application/json'
                })
                .send({
                    "jsonrpc": "2.0",
                    "method": "Player.Open",
                    "params": {
                        "item": {
                            "file": `/home/pi/storage/movies/${_.get(selected_movie, 'label')} (${_.get(selected_movie, 'year')})/${_.get(selected_movie, 'label')} (${_.get(selected_movie, 'year')}).strm`
                        }
                    },
                    "id": 1
                })
                .end((response) => {
                    if(_.get(response, 'status') == 200) {
                        let response_body = _.get(response, 'body');
                        callback(null, response_body);
                    } else {
                        callback(response.error)
                    }
                })
            }
        ], (error, results) => {
            if(error) {
                reject(error.message);
            } else {
                resolve(results);
            }
        })
    })
}