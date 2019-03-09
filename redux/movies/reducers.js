const moment = require('moment');
const uuid = require('uuid/v1');
const _ = require('lodash');
const Immutable = require('immutable');
const logger = require('pino')()

module.exports = (state = Immutable.List(), action) => {
    switch(action.type) {
        case require('./consts').ADD_MOVIES:
            let movies_list = action.moviesList;

            let newState = state;
            movies_list.forEach(movie => {
                newState = newState.push({
                    libraryId: _.get(movie, 'libraryId'),
                    title: _.get(movie,'title'),
                    path: _.get(movie, 'path'),
                    _receivedAt: moment().format()
                })                
            })
            logger.info(`To store were pushed ${movies_list.length} movies.`)

            return newState;

        case require('./consts').ADD_MOVIE:
            let foundIndex = state.findIndex(item => {
                return item.get('libraryId') == action.libraryId;
            });
            if(foundIndex == -1) {
                return state.push({
                    libraryId: action.libraryId,
                    title: action.title,
                    path: action.path,
                    _receivedAt: moment().format()
                })
            } else {
                return state;
            }

        default:
            return state;
    }
};