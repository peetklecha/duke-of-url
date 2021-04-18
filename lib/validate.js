const e = require("./errors")
const { QUERY, BODY, END } = require("./symbols")

module.exports = function validate(api, head, methodSymbol, query, body) {
	if (!api) return
	if (methodSymbol !== END && !(methodSymbol in api))
		throw e.badMethod(head, config.method)
	const endpoint = api[methodSymbol] || api
	if (query !== undefined) {
		if (endpoint && typeof endpoint === "object" && QUERY in endpoint)
			validatePayload(endpoint[QUERY], head, query, "query")
		else validatePayload(endpoint, head, query, "query")
	}
	if (body !== undefined) {
		if (endpoint && typeof endpoint === "object" && BODY in endpoint)
			validatePayload(endpoint[BODY], head, body, "body")
		else validatePayload(endpoint, head, body, "body")
	}
}

function validatePayload(endpoint, head, payload, type) {
	const keys = Object.keys(payload)

	if (endpoint === true) return
	if (endpoint === false && keys.length) throw e.noPayload(head, type)
	if (typeof endpoint === "function" && endpoint(payload) === false)
		throw e.customValidatorFailed(head, endpoint)
	if (keys.some(keyExcluded(endpoint))) throw e.badKey(key, head, type)
	else if (keys.some(keyValueExcluded(endpoint, payload)))
		throw e.badValue(payload, key, head, type)
}

function keyExcluded(endpoint) {
	return key =>
		(Array.isArray(endpoint) && !endpoint.includes(key)) ||
		(!Array.isArray(endpoint) && !(key in endpoint))
}

function keyValueExcluded(endpoint, query) {
	return key =>
		(Array.isArray(endpoint[key]) && !endpoint[key].includes(query[key])) ||
		(typeof endpoint[key] === "function" && !endpoint[key](query[key]))
}
