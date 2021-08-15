const s = require("./symbols")
const e = require("./errors")
const Endpoint = require("./endpoint")

module.exports = function buildUrl(accum, config, arg1, arg2, method) {
	let { api, head = "", routeFormat } = config
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
	const endpoint = new Endpoint(api, method, head, config)
	const { body, query } = endpoint.getPayloads(arg1, arg2)
	const url = head + queryObjToString(query)
	return { url, body }
}

function incrementHead(api, route, routeFormat) {
	const value = api && (api[route][s.FORMAT] || routeFormat)
	return (
		"/" + (value ? (typeof value === "function" ? value(route) : value) : route)
	)
}

function queryObjToString(query = {}) {
	const qString = Object.keys(query)
		.map(key => (query[key] === undefined ? "" : key + "=" + query[key]))
		.filter(x => x)
		.join("&")
	return qString && "?" + qString
}
