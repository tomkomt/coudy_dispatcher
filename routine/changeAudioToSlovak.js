const Immutable = require('immutable');
const _ = require('lodash');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const logger = require('pino')()
const unirest = require('unirest');
const series = require('async/series')

module.exports = (command_item) => {
    return new Promise((resolve, reject) => {
        var active_player_id = {}
        var available_audiostreams = []
        var available_subtitles = []

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
                        active_player_id = _.get(response, ['body', 'result', 0, 'playerid']);
                        callback(null, active_player_id);
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
                    "method": "Player.GetProperties",
                    "params": {
                        "playerid": active_player_id,
                        "properties": ["audiostreams", "subtitles"]
                    },
                    "id": 1
                })
                .end((response) => {
                    if(_.get(response, 'status') == 200) {
                        available_audiostreams = _.get(response, ['body', 'result', 'audiostreams']);
                        available_subtitles = _.get(response, ['body', 'result', 'subtitles']);
                        callback(null, [available_audiostreams, available_subtitles]);
                    } else {
                        callback(response.error)
                    }
                })
            },
            (callback) => {
                let slo_audiostream = _.find(available_audiostreams, subs => {
                    return _.get(subs, 'language') == 'slo';
                })
                if(slo_audiostream) {
                    unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
                    .headers({
                        'Content-Type': 'application/json'
                    })
                    .send({
                        "jsonrpc": "2.0",
                        "method": "Player.SetAudioStream",
                        "params": {
                            "playerid": active_player_id,
                            "stream": _.get(slo_audiostream, 'index')
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
                    callback();
                }
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