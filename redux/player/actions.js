function setLastPlayingCommand(command) {
    return {
        type: require('./consts').SET_LAST_PLAYING_COMMAND,
        command: command
    }
}

function saveTranscriptAlternatives(alternatives) {
    return {
        type: require('./consts').SAVE_TRANSCRIPT_ALTERNATIVES,
        alternatives: alternatives
    }
}

module.exports = {
    setLastPlayingCommand: setLastPlayingCommand,
    saveTranscriptAlternatives: saveTranscriptAlternatives
}