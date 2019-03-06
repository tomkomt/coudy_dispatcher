const Immutable = require('immutable');
const _ = require('lodash');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const logger = require('pino')()
const unirest = require('unirest');
const eachSeries = require('async/eachSeries')

module.exports = (req, res, next) => {
    debugger;
    let transcripts = _.get(req, ['context', 'transcripts'])
    let commands = []

    if(transcripts.length > 0) {
        commands = _
            .orderBy(
                _.get(req, ['context', 'transcripts']), 'confidence', 'desc'
            )
            .filter(
                transcript => _.get(transcript, 'command').indexOf('kodi__') > -1
            )
            .map(
                transcript => _.get(transcript, 'command')
            )
    }
    logger.info('Commands: ', commands)

    eachSeries(commands, (command_item, callback) => {
        let request_body = {
            "jsonrpc": "2.0",
            "method": configParams.getIn(['services', 'kodi_jsonrpc', 'methods', command_item, 'method']),
            "params": configParams.getIn(['services', 'kodi_jsonrpc', 'methods', command_item, 'params']).toJS(),
            "id": 1
        }

        unirest.post(configParams.getIn(['services', 'kodi_jsonrpc', 'url']))
        .headers({
            'Content-Type': 'application/json'
        })
        .send(request_body)
        .end((response) => {
            if(_.get(response, 'status') == 200) {
                callback(null, _.get(response, 'body'));
            } else {
                callback(response.error)
            }
        })
    }, (error, cb_results) => {
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