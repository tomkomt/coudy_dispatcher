const Immutable = require('immutable');
const _ = require('lodash');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const logger = require('pino')()
const unirest = require('unirest');
const series = require('async/series')
const stringSimilarity = require('string-similarity');

module.exports = (transcript_alternatives) => {
    return new Promise((resolve, reject) => {
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
                    resolve(movie_object.get('label'));
                } else {
                    reject(response.error)
                }
            })    
        }    
    });
}