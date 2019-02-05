/**
 * Handle sending messages to Speech to text service instance
 * 
 * @param {*} app 
 */

module.exports = (app) => {
    app.route('/api/v1/speech')
    .post(require('./modules/postProcessAudioMp3.js'));
}