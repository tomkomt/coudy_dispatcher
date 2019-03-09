const Immutable = require('immutable');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const _ = require('lodash');
const logger = require('pino')()
const stringSimilarity = require('string-similarity');

module.exports = (req, res, next) => {
    const all_keywords = configParams.getIn(['services', 'speech2text', 'commands_keywords']).toList().flatten(true).toJS();

    const speechToText = new SpeechToTextV1({
        iam_apikey: configParams.getIn(['services', 'speech2text', 'apikey']),
        url: configParams.getIn(['services', 'speech2text', 'url'])
    });

    const recognizeParams = {
        audio: req.files.audioData.data,
        content_type: configParams.getIn(['services', 'speech2text', 'source_devices', 'mobile', 'content-type']),
        max_alternatives: configParams.getIn(['services', 'speech2text', 'alternatives', 'max_alternatives']),
        word_alternatives_threshold: configParams.getIn(['services', 'speech2text', 'alternatives', 'word_alternatives_threshold']),
        timestamps: true,
        model: 'en-US_NarrowbandModel'
    };

    new Promise((resolve, reject) => {
        speechToText.recognize(recognizeParams, (error, results) => {
            if(error) {
                logger.error(error);
                reject(error);
            } else {
                logger.info("Alternatives: ", _.get(results, ['results', 0, 'alternatives']));
                const matches = _.get(results, ['results', 0, 'alternatives']).map(alternative => {
                    return stringSimilarity.findBestMatch(_.get(alternative, 'transcript'), all_keywords)
                }).map(match => {
                    return {
                        match_string: _.get(match, ['bestMatch', 'target']),
                        meta: _.get(match, 'bestMatch')
                    }
                }).map(match => {
                    let command_key = configParams.getIn(['services', 'speech2text', 'commands_keywords'])
                    .keySeq()
                    .toList()
                    .find(key => configParams.getIn(['services', 'speech2text', 'commands_keywords']).get(key).includes(_.get(match, 'match_string').toLowerCase()))
                    _.set(match, 'command', command_key);     
                    return match;               
                });
                logger.info('Matches: ', matches);

                const reduced_matches = matches.reduce((acc, match) => {
                    let found_index = _.findIndex(acc, object => {
                        return _.get(object, 'command') == _.get(match, 'command');
                    });
                    if(found_index > -1) {
                        _.set(acc, [found_index, 'count'], _.get(acc, [found_index, 'count']) + 1);
                    } else {
                        acc.push({
                            command: _.get(match, 'command'),
                            count: 1
                        });    
                    }
                    return acc;
                }, [])
                logger.info('Reduced matches: ', reduced_matches);
                
                const command_match = _.head(_.orderBy(reduced_matches, 'count', 'desc'));

                resolve({
                    error: false,
                    keywords: {
                        command: _.get(command_match, 'command'),
                        confidence: 1
                    },
                    alternatives: _.get(results, ['results', 0, 'alternatives']),
                    message: 'All good'
                });
            }
        })
    }).then(results => {
        _.set(req, ['context', 'keywords'], [_.get(results, 'keywords')]);
        _.set(req, ['context', 'transcript_alternatives'], _.get(results, 'alternatives'));
        next();
    }).catch(error => {
        res.status(402).send({
            error: true,
            message: error.message
        })
    })
}