const { BodyConfig, QueryConfig } = require("./payload")

class Endpoint {
	constructor(endpointConfig, method, url, apiConfig) {
		this.method = method
		this.config = endpointConfig
		this.api = apiConfig
		this.url = url
		this.query = new QueryConfig(this)
		this.body = new BodyConfig(this)
	}

	identifyPayloads(firstArg, secondArg) {
		const swap =
			(this.query.isDefault && this.body.preferred) ||
			(this.body.isDefault && this.query.preferred)
		;[this.query.raw, this.body.raw] =
			this.query.isDefault ^ swap
				? [firstArg, secondArg]
				: [secondArg, firstArg]
	}

	getPayloads(firstArg, secondArg) {
		this.identifyPayloads(firstArg, secondArg)
		this.query.format()
		this.query.test()
		this.body.format()
		this.body.test()
		return {
			body: this.body.final,
			query: this.query.final,
		}
	}
}

module.exports = Endpoint
