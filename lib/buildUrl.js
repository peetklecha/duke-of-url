const s = require("./symbols")
const e = require("./errors")
const validate = require("./validate")

module.exports = function buildUrl(accum, config, arg1, arg2, method) {
	let { api, head, routeFormat } = config
	for (const route of accum) {
		if (!api) {
			head += incrementHead(api, route, routeFormat)
		} else if (route in api) {
			head += incrementHead(api, route, routeFormat)
			api = api[route]
		} else if (s.PARAM in api) {
			head += "/" + route
			api = api[s.PARAM]
		} else throw e.noBranch(route, head)
	}
	if (config.tail) head += config.tail
	const { rawBody, rawQuery } = getQueryAndBody(arg1, arg2, method, api)
	const body = payload(rawBody, api, config, method, head, "body")
	const query = payload(rawQuery, api, config, method, head, "query")
	const url = head + queryObjToString(query)
	return { url, body }
}

function incrementHead(api, route, routeFormat) {
	const value = api && (api[route][s.FORMAT] || routeFormat)
	return (
		"/" + (value ? (typeof value === "function" ? value(route) : value) : route)
	)
}

function payload(rawPayload, api, config, method, head, type) {
	if (!rawPayload) return undefined
	const validator = getValidator(api, method, type)
	const format =
		(validator[method] && validator[method][s.FORMAT]) ||
		config[type + "Format"] ||
		(x => x)
	const finalPayload = format(rawPayload)
	if (validator) validate(validator, head, method, finalPayload)
	return finalPayload
}

function getValidator(api, methodSymbol, payloadType) {
	if (methodSymbol === s.END && !(typeof api === "object" && s.END in api)) {
		api = { [s.END]: api }
	}
	switch (payloadType) {
		case "query":
			return s.QUERY in api
				? api[s.QUERY]
				: methodSymbol === s.GET ||
				  methodSymbol === s.DELETE ||
				  methodSymbol === s.END
				? api
				: null
		case "body":
			return s.BODY in api
				? api[s.BODY]
				: methodSymbol === s.PUT || methodSymbol === s.POST
				? api
				: null
		default:
			throw new Error("This shouldn't happen.")
	}
}

function getQueryAndBody(firstArg, secondArg, methodSymbol, api) {
	if (!api) return { rawQuery: firstArg }
	const [rawQuery, rawBody] =
		methodSymbol === s.GET ||
		methodSymbol === s.DELETE ||
		methodSymbol === s.END
			? api[s.BODY] && api[s.QUERY] === false
				? [secondArg, firstArg]
				: [firstArg, secondArg]
			: api[s.QUERY] && api[s.BODY] === false
			? [firstArg, secondArg]
			: [secondArg, firstArg]
	return { rawQuery, rawBody }
}

function queryObjToString(query = {}) {
	let qString = Object.keys(query)
		.map(key => (query[key] === undefined ? "" : key + "=" + query[key]))
		.filter(x => x)
		.join("&")
	qString = qString && "?" + qString
	return qString
}
