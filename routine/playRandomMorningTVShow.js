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
                    "method": "VideoLibrary.GetTVShows",
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
                        let movies_list = _.get(response_body, ['result', 'tvshows']);
                        selected_movie = _
                            .chain(movies_list)
                            .filter(item => {
                                return [
                                    'The Big Bang Theory',
                                    'Two and a Half Men',
                                    'Young Sheldon'
                                ].indexOf(_.get(item, 'label')) > -1;
                            })
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
                    "method": "VideoLibrary.GetEpisodes",
                    "params": {
                        "properties": ["playcount", "file"],
                        "tvshowid": _.get(selected_movie, 'tvshowid')
                    },
                    "id": 1
                })
                .end((response) => {
                    if(_.get(response, 'status') == 200) {
                        let response_body = _.get(response, 'body');
                        let episodes_list = _.get(response_body, ['result', 'episodes']);
                        selected_episode = _
                            .chain(episodes_list)
                            .sortBy('playcount', 'desc')
                            .slice(0, 10)
                            .shuffle()
                            .head()
                            .value()
                        callback(null, selected_episode);
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
                            "file": _.get(selected_episode, 'file')
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