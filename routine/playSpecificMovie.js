const Immutable = require('immutable');
const _ = require('lodash');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const logger = require('pino')()
const unirest = require('unirest');
const series = require('async/series')
const stringSimilarity = require('string-similarity');
const series = require('async/series')

module.exports = (command_item, transcript_alternatives) => {
    return new Promise((resolve, reject) => {
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
            callback => {
                const store_movies = require('../redux/store').getState().movies;
                const separators = ['titled', 'called'];
                const acceptable_alternatives = transcript_alternatives.filter(sentence => {
                    return _.some(separators, separator => {
                        return _.get(sentence, 'transcript').indexOf(separator) > -1;
                    });
                });
                const keywords = configParams.getIn(['services', 'speech2text', 'commands_keywords', 'kodi__play_specific_movie']);
            
                var movie_title_options = acceptable_alternatives.reduce((acc, item) => {
                    let separed = separators.map(separator => {
                        return _.get(item, 'transcript').split(separator);
                    });
                    acc.push(_.get(separed, [1, 1]));
            
                    return acc;
                }, []);
                movie_title_options = _.uniq(movie_title_options);
            
                var movie_titles_matches = movie_title_options.map(option => {
                    return stringSimilarity.findBestMatch(option, store_movies.map(movie => movie.get('title')).toJS());
                });
            
                const best_match_movie = _.head(_.orderBy(movie_titles_matches, 'bestMatch.rating', 'desc'));
                const movie_object = store_movies.get(_.get(best_match_movie, 'bestMatchIndex'));
            
                if(movie_object) {
                    unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
                    .headers({
                        'Content-Type': 'application/json'
                    })
                    .send({
                        "jsonrpc": "2.0",
                        "method": "Player.Open",
                        "params": {
                            "item": {
                                "file": movie_object.get('file')
                            }
                        },
                        "id": 1
                    })
                    .end((response) => {
                        if(_.get(response, 'status') == 200) {
                            callback(null, movie_object.get('label'));
                        } else {
                            callback(response.error)
                        }
                    })    
                }    
            },
            callback => {
                require('../redux/store').dispatch(require('../redux/player/actions').setLastPlayingCommand(command_item));
                require('../redux/store').dispatch(require('../redux/player/actions').saveTranscriptAlternatives(transcript_alternatives));
                callback(null, 'OK');
            }
        ], (error, results) => {
            if(error) {
                reject(error.message);
            } else {
                resolve(results);
            }
        })
    });
}