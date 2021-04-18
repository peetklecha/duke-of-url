const s = require("./symbols")
const e = require("./errors")
const buildUrl = require("./buildUrl")

module.exports = function makeRequest(accum, config, firstArg, secondArg) {
	const methodSymbol = setMethod(accum, config)
	const { url, body } = buildUrl(
		accum,
		config,
		firstArg,
		secondArg,
		methodSymbol
	)
	if (config.log) {
		if (typeof config.log === "function") console.log(config.log(url))
		else console.log(`OUTGOING REQUEST: ${url}`)
	}
	const returnValue = config.client[config.method](url, body)
	return config.responseFormat
		? config.responseFormat(returnValue)
		: returnValue
}

const methods = {
	get: s.GET,
	put: s.PUT,
	post: s.POST,
	delete: s.DELETE,
}

function setMethod(accum, config) {
	const method = accum.shift()
	if (!methods[method]) throw e.missingMethod(method)
	config.method = method
	return methods[method]
}
