const s = require("./symbols")
const e = require("./errors")

class PayloadConfig {
	constructor(endpoint) {
		this.endpoint = endpoint
		this.validator = this.getValidator()
		if (this.validator === null)
			throw e.badMethod(this.endpoint.url, this.endpoint.method)
		this.formatter =
			this.validator?.[s.FORMAT] ||
			endpoint.api[this.type + "Format"] ||
			(x => x)
		this.raw = undefined
		this.final = undefined
	}

	getValidator(method) {
		const { defaultMethods, symbol } = this.constructor
		const { config } = this.endpoint
		if (config === undefined) return true
		method = method || this.endpoint.method
		if (defaultMethods.includes(method))
			return defaultValidator(config, method, symbol)
		else return nonDefaultValidator(config, method, symbol)
	}

	get type() {
		return this.constructor.type
	}

	get other() {
		return this.endpoint[this.constructor.otherType]
	}

	get isDefault() {
		return this.constructor.defaultMethods.includes(this.endpoint.method)
	}

	get preferred() {
		return !!this.validator && this.other.validator === false
	}

	format() {
		if (this.raw !== undefined) this.final = this.formatter(this.raw)
	}

	test() {
		const { validator, type, final } = this
		const { url } = this.endpoint
		if (!final) return
		const keys = Object.keys(final)
		if (validator === true) return
		if (validator === false && keys.length) throw e.noPayload(url, type)
		if (typeof validator === "function" && validator(final) === false)
			throw e.customValidatorFailed(url, validator)
		const badKey = keys.find(keyExcluded(validator))
		if (badKey) throw e.badKey(badKey, url, type)
		const keyWithBadValue = keys.find(keyValueExcluded(validator, final))
		if (keyWithBadValue) throw e.badValue(final, keyWithBadValue, url, type)
	}
}

class BodyConfig extends PayloadConfig {
	static defaultMethods = [s.PUT, s.POST]
	static symbol = s.BODY
	static type = "body"
	static otherType = "query"
}

class QueryConfig extends PayloadConfig {
	static defaultMethods = [s.GET, s.DELETE, s.END]
	static symbol = s.QUERY
	static type = "query"
	static otherType = "body"

	getValidator() {
		return super.getValidator() ?? super.getValidator(s.END)
	}
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

function nonDefaultValidator(config, method, symbol) {
	if (
		!isAnonymousValidator(config) &&
		method in config &&
		typeof config[method] === "object" &&
		symbol in config[method]
	)
		return config[method][symbol]
	return false
}

function defaultValidator(config, method, symbol) {
	if (isAnonymousValidator(config)) return config
	if (method in config)
		return payloadValidatorFromMethod(config[method], symbol)
	return null
}

function payloadValidatorFromMethod(methodSpecificEndpoint, payloadSymbol) {
	return typeof methodSpecificEndpoint === "object" &&
		payloadSymbol in methodSpecificEndpoint
		? methodSpecificEndpoint[payloadSymbol]
		: methodSpecificEndpoint
}

function isAnonymousValidator(obj) {
	switch (typeof obj) {
		case "function":
		case "boolean":
			return true
		case "object":
			return Array.isArray(obj)
		default:
			return false
	}
}

module.exports = {
	BodyConfig,
	QueryConfig,
}
