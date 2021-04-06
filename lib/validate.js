const e = require("./errors")

module.exports = function validate(target, method, query = {}) {
	const { api, accumUrl } = target
	const endpoint = api[method]
	const keys = Object.keys(query)

	if (endpoint === false && keys.length) throw e.noQuery(accumUrl)
	if (keys.some(keyExcluded(endpoint))) throw e.badKey(key, accumUrl)
	else if (keys.some(keyValueExcluded(endpoint, query)))
		throw e.badValue(query, key, accumUrl)
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
