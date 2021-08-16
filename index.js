const e = require("./lib/errors")
const { END } = require("./lib/symbols")
const buildUrl = require("./lib/buildUrl")
const makeRequest = require("./lib/makeReq")

function collector(config, accum = []) {
	function finalize(firstArg, secondArg, ...args) {
		return config.client
			? makeRequest(accum, config, firstArg, secondArg, ...args)
			: buildUrl(accum, config, firstArg, secondArg, END).url
	}
	return new Proxy(finalize, {
		get(_, prop) {
			return collector(config, accum.concat(prop))
		},
	})
}

module.exports = {
	...require("./lib/symbols"),
	reqMaker(config) {
		const _config = { ...config }
		if (!_config.client) throw e.noClient()
		return collector(_config)
	},
	urlMaker(config) {
		const _config = { ...config }
		delete _config.client
		return collector(_config)
	},
}
