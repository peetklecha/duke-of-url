const e = require("./lib/errors")
const buildUrl = require("./lib/buildUrl")
const makeRequest = require("./lib/makeReq")

function collector(config, accum = []) {
	function finalize(...args) {
		return config.client
			? makeRequest(accum, config, ...args)
			: buildUrl(accum, config, ...args).url
	}
	return new Proxy(finalize, {
		get(_, prop) {
			return collector(config, accum.concat(prop))
		},
	})
}

module.exports = {
	...require("./lib/symbols"),
	reqMaker(_config) {
		const config = { ..._config }
		if (!config.client) throw e.noClient()
		return collector(config)
	},
	urlMaker(_config) {
		const config = { ..._config }
		delete config.client
		return collector(config)
	},
}
