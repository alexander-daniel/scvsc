function stringifyError(value) {
    const { type, error } = value
    if (type === 'SyntaxError') {
        value = `${type}: ${error.msg}`
        value += `\n    line: ${error.line}, char: ${error.charPos}`
        value += `\n${error.code}`
    } else if (type === 'Error') {
        const args = (error.args || []).map((arg) => `${arg.class} ${arg.asString}`).join(', ')
        const receiver = error.receiver || 'no receiver'
        error.errorString = error.errorString || 'UnknownError'
        error.class = error.class || ''
        value = error.errorString.replace('ERROR', error.class)
        value += `\n    receiver: ${receiver.asString}, args: [${args}]`
    }
    return value
}
module.exports = {
    stringifyError
};