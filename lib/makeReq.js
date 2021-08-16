const s = require("./symbols")
const e = require("./errors")
const buildUrl = require("./buildUrl")

module.exports = function makeRequest(accum, config, firstArg, secondArg, ...args) {
	const { methodSymbol, method } = getMethod(accum)
	const { url, body } = buildUrl(
		accum,
		config,
		firstArg,
		secondArg,
		methodSymbol
	)
	const { log, client, responseFormat } = config
	if (log) {
		if (typeof log === "function") console.log(log(url))
		else console.log(`OUTGOING REQUEST: ${url}`)
	}
	const restArgs = body === undefined ? args : [body, ...args]
	const returnValue = client[method](url, ...restArgs)
	return responseFormat
		? responseFormat(returnValue)
		: returnValue
}

const methods = {
	get: s.GET,
	put: s.PUT,
	post: s.POST,
	delete: s.DELETE,
}

function getMethod(accum) {
	const method = accum.shift()
	if (!methods[method].toLowerCase()) throw e.missingMethod(method)
	return { methodSymbol: methods[method], method }
}
