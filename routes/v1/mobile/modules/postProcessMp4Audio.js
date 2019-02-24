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
        keywords: configParams.getIn(['services', 'speech2text', 'keywords']).toJS(),
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
            debugger;
            let transcripts = _
                .chain(_.get(results, 'results'))
                .reduce((acc, item) => {
                    acc.push(_.get(item, 'alternatives').map(alternative => {
                        return {
                            transcript: _.get(alternative, 'transcript'),
                            confidence: _.get(alternative, 'confidence')
                        }
                    }));
                    return acc;
                }, [])
                .flattenDeep()
                .sortBy('confidence')
                .reverse()
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