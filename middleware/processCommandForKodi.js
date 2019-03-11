const Immutable = require('immutable');
const configParams = Immutable.fromJS(require('../config.dev.json'));
const unirest = require('unirest');

module.exports = (transcript_alternatives, command_item, callback) => {
    let command_config = configParams.getIn(['services', 'kodi_jsonrpc', 'methods', command_item])
    switch(command_config.get('type')) {
        case 'method':
            let request_body = {
                "jsonrpc": "2.0",
                "method": command_config.get('method'),
                "params": command_config.get('params').toJS(),
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
        break;

        case 'middleware':
        case 'middleware_playing':
            require(`../routine/${command_config.get('method')}.js`)(command_item).then(results => {
                callback(null, results);
            }).catch(error => {
                callback(error.message);
            })
        break;

        case 'middleware_specific_playing':
            require(`../routine/${command_config.get('method')}.js`)(command_item, transcript_alternatives).then(results => {
                callback(null, results);
            }).catch(error => {
                callback(error.message);
            })
        break;
        
        default:
            callback(null, [])
        break;
    }
}