class JUJError extends Error {
	constructor(msg) {
		super("URLValidationError: " + msg)
	}
}

module.exports = {
	tooFar: () => new JUJError("URL goes beyond obligatory endpoint."),
	missingMethod: method => new JUJError(`${method} is not a supported method.`),
	noBranch: (branch, route) =>
		new JUJError(`Branch ${branch} not defined for ${route}`),
	noClient: () => new JUJError("No client provided."),
	noParam: url => new JUJError(`Parameter not permitted at ${url}`),
	noQuery: url => new JUJError(`No query permitted at ${url}.`),
	badMethod: (url, method) =>
		new JUJError(`Method ${method} not supported at ${url}`),
	badKey: (key, url) =>
		new JUJError(`Query key ${key} not permitted for endpoint ${url}`),
	badValue: (query, key, url) =>
		new JUJError(
			`Value ${query[key]} not permitted for query key ${key} at endpoint ${url}`
		),
}
