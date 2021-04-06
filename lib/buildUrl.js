const s = require("./symbols")
const e = require("./errors")

module.exports = function buildUrl(accum, { api, head }, query) {
	for (const route of accum) {
		if (route in api) {
			head += incrementHead(api, route)
			api = api[route]
		} else if (s.PARAM in api) {
			head += "/" + route
			api = api[s.PARAM]
		} else throw e.noBranch(route, head)
	}
	const url = head + queryObjToString(query)
	return { head, api, url }
}

function incrementHead(api, route) {
	const value = api[route][s.VALUE]
	return (
		"/" + (value ? (typeof value === "function" ? value(route) : value) : route)
	)
}

function queryObjToString(query = {}) {
	let qString = Object.keys(query)
		.map(key => (query[key] === undefined ? "" : key + "=" + query[key]))
		.filter(x => x)
		.join("&")
	qString = qString && "?" + qString
	return qString
}
