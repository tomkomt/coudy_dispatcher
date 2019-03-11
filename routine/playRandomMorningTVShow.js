const Immutable = require('immutable');
const _ = require('lodash');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const logger = require('pino')()
const unirest = require('unirest');
const series = require('async/series')

module.exports = (command_item) => {
    return new Promise((resolve, reject) => {
        var selected_movie = {}
        var active_player_id = 0;

        series([
            (callback) => {
                unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
                .headers({
                    'Content-Type': 'application/json'
                })
                .send({
                    "jsonrpc": "2.0",
                    "method": "Player.GetActivePlayers",
                    "id": 1
                })
                .end((response) => {
                    if(_.get(response, 'status') == 200) {
                        let response_body = _.get(response, 'body');
                        let players_list = _.get(response_body, ['result']);
                        if(players_list.length > 0) {
                            active_player_id = _.get(players_list, [0, 'playerid']);
                        }
                        callback(null, selected_movie);
                    } else {
                        callback(response.error)
                    }
                })
            },
            (callback) => {
                if(active_player_id > 0) {
                    unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
                    .headers({
                        'Content-Type': 'application/json'
                    })
                    .send({
                        "jsonrpc": "2.0",
                        "method": "Player.Stop",
                        "params": {
                            "playerid": active_player_id
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
                } else {
                    callback(null, active_player_id);
                }
            },
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
                            .sortBy('playcount', 'asc')
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
            },
            (callback) => {
                require('../redux/store').dispatch(require('../redux/player/actions').setLastPlayingCommand(command_item));
                require('../redux/store').dispatch(require('../redux/player/actions').saveTranscriptAlternatives([]));
                callback(null, 'OK');
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