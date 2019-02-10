/**
 * Handle sending messages to Speech to text service instance from mobile phone
 * Audio from mobile phone is with 800 Hz bandwidth
 * Narrowband model is needed
 * 
 * @param {*} app 
 */

module.exports = (app) => {
    app.route('/api/v1/mobile')
    .post(require('./modules/postProcessMp4Audio.js'));
}