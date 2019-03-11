const Immutable = require('immutable');
const _ = require('lodash');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const logger = require('pino')()
const unirest = require('unirest');
const series = require('async/series')

module.exports = (command_item) => {
    return new Promise((resolve, reject) => {
        var previous_command = {}

        series([
            (callback) => {
                previous_command = require('../redux/store').getState().player.get('command');
                callback(null, previous_command);
            },
            (callback) => {
                let command_routine = configParams.getIn(['services', 'kodi_jsonrpc', 'methods', previous_command]);
                if(command_routine) {
                    require('../middleware/processCommandForKodi')([], previous_command, callback);
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