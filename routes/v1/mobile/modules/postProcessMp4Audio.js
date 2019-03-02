const Immutable = require('immutable');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const configParams = Immutable.fromJS(require('../../../../config.dev.json'));
const _ = require('lodash');
const logger = require('pino')()

module.exports = (req, res, next) => {
    const speechToText = new SpeechToTextV1({
        iam_apikey: configParams.getIn(['services', 'speech2text', 'apikey']),
        url: configParams.getIn(['services', 'speech2text', 'url'])
    });

    const recognizeParams = {
        audio: req.files.audioData.data,
        content_type: configParams.getIn(['services', 'speech2text', 'source_devices', 'mobile', 'content-type']),
        keywords: configParams.getIn(['services', 'speech2text', 'commands_keywords']).toList().flatten(true).toJS(),
        keywords_threshold: configParams.getIn(['services', 'speech2text', 'keywords_threshold']),
        max_alternatives: configParams.getIn(['services', 'speech2text', 'alternatives', 'max_alternatives']),
        word_alternatives_threshold: configParams.getIn(['services', 'speech2text', 'alternatives', 'word_alternatives_threshold']),
        timestamps: true,
        model: 'en-US_NarrowbandModel'
    };

    speechToText.recognize(recognizeParams, (error, results) => {
        if(error) {
            logger.error(error);
            res.status(400).send({
                error: true,
                transcripts: [],
                error: error.message
            });
        } else {
            let transcripts = _
                .chain(_.get(results, 'results'))
                .reduce((acc, item) => {
                    acc.push(_.sortBy(_.get(item, 'keywords_result'), keyword => _.get(keyword, [0, 'confidence'])).map(keyword => _.get(keyword, 0)));
                    return acc;
                }, [])
                .reverse()
                .reduce((acc, items) => {
                    debugger;
                    acc.push(items.map(item => {
                        let command_key = configParams.getIn(['services', 'speech2text', 'commands_keywords'])
                            .keySeq()
                            .toList()
                            .find(key => configParams.getIn(['services', 'speech2text', 'commands_keywords']).get(key).includes(_.lowerCase(_.get(item, 'normalized_text'))))
                        _.set(item, 'command', command_key);
                        return item;
                    }))
                    acc.push(items);
                    return acc;
                }, [])
                .value()
                
            logger.info(results);
            res.status(200).send({
                error: false,
                transcripts: transcripts,
                error: 'All good'
            });
        }
    })
}