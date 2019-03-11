const Immutable = require('immutable');
const _ = require('lodash');
const logger = require('pino')()
const eachSeries = require('async/eachSeries')

module.exports = (req, res, next) => {
    let keywords = _.get(req, ['context', 'keywords']) || []
    let transcript_alternatives = _.get(req, ['context', 'transcript_alternatives']) || []
    let commands = _.get(req, ['body', 'simulated_commands']) || []

    if(keywords.length > 0) {
        commands = _
            .orderBy(
                keywords, 'confidence', 'desc'
            )
            .filter(
                transcript => _.get(transcript, 'command').indexOf('kodi__') > -1
            )
            .map(
                transcript => _.get(transcript, 'command')
            )
    }
    logger.info('Commands: ', commands);

    eachSeries(commands, require('./processCommandForKodi.js').bind(this, transcript_alternatives), (error, cb_results) => {
        if(error) {
            res.status(402).send({
                error: true,
                message: error,
                commands: commands
            })
        } else {
            res.status(200).send({
                error: false,
                message: cb_results,
                commands: commands
            })
        }
    })
}