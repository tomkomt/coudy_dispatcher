const { combineReducers } = require('redux');

const movies = require('./movies/reducers');

module.exports = combineReducers({
    movies
});