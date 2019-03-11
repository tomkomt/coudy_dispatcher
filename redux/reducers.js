const { combineReducers } = require('redux');

const movies = require('./movies/reducers');
const player = require('./player/reducers');

module.exports = combineReducers({
    movies,
    player
});