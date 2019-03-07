module.exports = (app) => {
    app.route('/api/v1/simulator')
    .post(
        require('../../../middleware/passCommandsToKodi.js')
    );
}