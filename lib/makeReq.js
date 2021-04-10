const s = require("./symbols")
const e = require("./errors")
const buildUrl = require("./buildUrl")
const validate = require("./validate")

module.exports = function makeRequest(accum, config, firstArg, secondArg) {
	const methodSymbol = setMethod(accum, config)
	const [query, body] =
		methodSymbol === s.PUT || methodSymbol === s.POST
			? [secondArg, firstArg]
			: [firstArg, secondArg]
	const { api, head, url } = buildUrl(accum, config, query)
	if (methodSymbol in api) {
		validate({ api, accumUrl: head }, methodSymbol, query)
		return config.client[config.method](url, body)
	} else throw e.badMethod(head, config.method)
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
