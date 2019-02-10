const Immutable = require('immutable');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const configParams = Immutable.fromJS(require('../../../../config.dev.json'));

module.exports = (req, res, next) => {
    const speechToText = new SpeechToTextV1({
        iam_apikey: configParams.getIn(['services', 'speech2text', 'apikey']),
        url: configParams.getIn(['services', 'speech2text', 'url'])
    });

    const recognizeParams = {
        audio: req.files.audioData.data,
        content_type: configParams.getIn(['services', 'speech2text', 'source_devices', 'mobile', 'content-type']),
        timestamps: true,
        model: 'en-US_NarrowbandModel'
    };

    speechToText.recognize(recognizeParams, (error, results) => {
        if(error) {
            res.send(error);
        } else {
            console.log(results);
            res.status(200).send(results);
        }
    })
}