const moment = require('moment');
const uuid = require('uuid/v1');
const _ = require('lodash');
const Immutable = require('immutable');
const logger = require('pino')()
const configParams = Immutable.fromJS(require('../../config.dev.json'));

module.exports = (state = Immutable.Map({
    command: '',
    transcript_alternatives: []
}), action) => {
    switch(action.type) {
        case require('./consts').SET_LAST_PLAYING_COMMAND:
            let acceptable_commands = configParams.getIn(['services', 'kodi_jsonrpc', 'methods']).keySeq().toList()
            if(acceptable_commands.findIndex(item => item == action.command) > -1) {
                return state.set('command', action.command);    
            } else {
                return state;
            }

        case require('./consts').SAVE_TRANSCRIPT_ALTERNATIVES:
            return state.set('transcript_alternatives', action.alternatives);

        default:
            return state;
    }
};