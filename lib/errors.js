class URLError extends Error {
	constructor(msg) {
		super("URLValidationError: " + msg)
	}
}

function methodFormat(method) {
	return typeof method === "symbol" ? method.toString().slice(7, -1) : method
}

module.exports = {
	tooFar: () => new URLError("URL goes beyond obligatory endpoint"),
	missingMethod: method =>
		new URLError(`${methodFormat(method)} is not a supported method`),
	noBranch: (branch, route) =>
		new URLError(`Branch ${branch} not defined for ${route}`),
	noClient: () => new URLError("No client provided"),
	noParam: url => new URLError(`Parameter not permitted at ${url}`),
	noPayload: (url, payloadType) =>
		new URLError(`No ${payloadType} permitted at ${url}`),
	badMethod: (url, method) =>
		new URLError(`Method ${methodFormat(method)} not supported at ${url}`),
	badKey: (key, url, payloadType) =>
		new URLError(
			`${
				payloadType[0].toUpperCase() + payloadType.slice(1)
			} key '${key}' not permitted for endpoint ${url}`
		),
	badValue: (query, key, url, payloadType) =>
		new URLError(
			`Value '${query[key]}' not permitted for ${payloadType} key '${key}' at endpoint ${url}`
		),
	customValidatorFailed: (head, func) =>
		new URLError(`Custom validator ${func.name} failed for endpoint ${head}`),
}
