const e = require("./lib/errors")
const buildUrl = require("./lib/buildUrl")
const makeRequest = require("./lib/makeReq")

function collector(config, accum = []) {
	const output = Object.assign(() => {}, { accum })
	return new Proxy(output, {
		get(target, prop) {
			return collector(config, target.accum.concat(prop))
		},
		apply(target, _, args) {
			return config.client
				? makeRequest(target, config, ...args)
				: buildUrl(target.accum, config, args[0]).url
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
