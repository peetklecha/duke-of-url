const { describe, it, expect } = require("@jest/globals")
const {
	urlMaker,
	reqMaker,
	GET,
	PUT,
	POST,
	DELETE,
	END,
	QUERY,
	BODY,
	FORMAT,
	PARAM,
} = require("./")

function isId(value) {
	if (value == null) return false
	const str = value.toString()
	return !str.match(/\D/) && str.length === 12
}

function areIds(value) {
	if (value == null) return false
	const strs = value.toString().split(",")
	return strs.every(isId)
}

function isLimit(value) {
	if (value == null) return false
	const num = parseInt(value.toString())
	return !Number.isNaN(num) && num > 0 && num <= 250
}

const shopify = urlMaker({
	head: "http://wine-store.myshopify.com/admin/api/2020-10",
	tail: ".json",
	api: {
		customers: {
			[END]: {
				ids: areIds,
				since_id: isId,
				created_at_min: true,
				created_at_max: true,
				updated_at_min: true,
				updated_at_max: true,
				limit: isLimit,
				fields: true,
			},
			find: {
				[FORMAT]: "search",
				[END]: ["query"],
			},
			[PARAM]: {
				[END]: ["fields"],
				account_activation_url: false,
				send_invite: false,
				orders: true,
			},
			count: false,
		},
	},
})

const UC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const camelToKebab = str => {
	let output = ""
	for (const char of str) {
		output += UC.includes(char) ? "-" + char.toLowerCase() : char
	}
	return output
}

const api2 = urlMaker({
	routeFormat: camelToKebab,
	queryFormat: query => ({ auth: "1234", ...query }),
	api: {
		branchOne: {
			branchTwo: true,
		},
		branchThree: {
			[FORMAT]: "branch3",
			[END]: true,
		},
	},
})

const noValidations = urlMaker()

describe("urlMaker", () => {
	it("produces correct URLs", () => {
		expect(shopify.customers[2398840923]({ fields: "hello" })).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers/2398840923.json?fields=hello"
		)
		expect(
			shopify.customers[2934809234].orders({ hey: "hi", yeah: "sup" })
		).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers/2934809234/orders.json?hey=hi&yeah=sup"
		)
		expect(
			shopify.customers({ ids: [120938498207, 109283098126, 701923098166] })
		).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers.json?ids=120938498207,109283098126,701923098166"
		)
		expect(shopify.customers({ since_id: 120938498207, limit: 27 })).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers.json?since_id=120938498207&limit=27"
		)
		expect(api2.branchOne.branchTwo({})).toBe(
			"/branch-one/branch-two?auth=1234"
		)
		expect(api2.branchThree()).toBe("/branch3")
		expect(noValidations.one.two.three({ four: 5 })).toBe(
			"/one/two/three?four=5"
		)
	})
	it("errors properly", () => {
		expect.assertions(4)
		try {
			shopify.customers.count({ query: 46 })
		} catch (e) {
			expect(e.message).toBe(
				"URLValidationError: No query permitted at http://wine-store.myshopify.com/admin/api/2020-10/customers/count.json"
			)
		}
		try {
			shopify.customers.find({ fields: "name,age" })
		} catch (e) {
			expect(e.message).toBe(
				"URLValidationError: Query key 'fields' not permitted for endpoint http://wine-store.myshopify.com/admin/api/2020-10/customers/search.json"
			)
		}
		try {
			shopify.customers({ query: "John Hodgeman" })
		} catch (e) {
			expect(e.message).toBe(
				"URLValidationError: Query key 'query' not permitted for endpoint http://wine-store.myshopify.com/admin/api/2020-10/customers.json"
			)
		}
		try {
			shopify.customers({ limit: 251 })
		} catch (e) {
			expect(e.message).toBe(
				"URLValidationError: Value '251' not permitted for query key 'limit' at endpoint http://wine-store.myshopify.com/admin/api/2020-10/customers.json"
			)
		}
	})
})

const fakeClientFuncGetDel = method => (url, config) => ({ method, url, config })
const fakeClientFuncPutPost = method => (url, body, config) => ({ method, url, body, config })

const fakeClient = {
	get: fakeClientFuncGetDel("get"),
	put: fakeClientFuncPutPost("put"),
	post: fakeClientFuncPutPost("post"),
	delete: fakeClientFuncGetDel("delete"),
}

const shopify2 = reqMaker({
	head: "http://wine-store.myshopify.com/admin/api/2020-10",
	tail: ".json",
	client: fakeClient,
	api: {
		customers: {
			[POST]: true,
			[GET]: {
				ids: areIds,
				since_id: isId,
				created_at_min: true,
				created_at_max: true,
				updated_at_min: true,
				updated_at_max: true,
				limit: isLimit,
				fields: true,
			},
			find: {
				[FORMAT]: "search",
				[GET]: ["query"],
			},
			[PARAM]: {
				[GET]: ["fields"],
				[PUT]: true,
				[DELETE]: false,
				account_activation_url: { [POST]: true },
				send_invite: { [POST]: true },
				orders: { [GET]: true },
			},
			count: { [GET]: false },
		},
		otherThing: {
			[FORMAT]: "other-thing",
			[POST]: {
				[QUERY]: {
					ids: areIds,
					since_id: Number.isFinite,
					created_at_min: true,
					created_at_max: true,
				},
				[BODY]: false,
			},
		},
	},
})

describe("reqMaker", () => {
	it("configures requests correctly", async () => {
		const res1 = shopify2.get.customers[2398840923]({ fields: "hello" })
		expect(res1.method).toBe("get")
		expect(res1.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers/2398840923.json?fields=hello"
		)
		expect(res1.body).toBe(undefined)
		const res2 = shopify2.get.customers[2934809234].orders({
			hey: "hi",
			yeah: "sup",
		})
		expect(res2.method).toBe("get")
		expect(res2.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers/2934809234/orders.json?hey=hi&yeah=sup"
		)
		expect(res2.body).toBe(undefined)
		const res3 = shopify2.get.customers({
			ids: [120938498207, 109283098126, 701923098166],
		})
		expect(res3.method).toBe("get")
		expect(res3.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers.json?ids=120938498207,109283098126,701923098166"
		)
		expect(res3.body).toBe(undefined)
		const body4 = { key: "value" }
		const res4 = shopify2.post.customers(body4)
		expect(res4.method).toBe("post")
		expect(res4.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers.json"
		)
		expect(res4.body).toBe(body4)
		const res5 = shopify2.post.otherThing({ since_id: 47 })
		expect(res5.method).toBe("post")
		expect(res5.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/other-thing.json?since_id=47"
		)
		expect(res5.body).toBe(undefined)
		const res6 = shopify2.GET.customers[2398840923]({ fields: "hello" })
		expect(res6.method).toBe("get")
		expect(res6.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers/2398840923.json?fields=hello"
		)
		expect(res6.body).toBe(undefined)
	})
	it("errors properly", () => {
		expect.assertions(1)
		try {
			shopify2.put.customers({ name: "fred" })
		} catch (e) {
			expect(e.message).toBe(
				"URLValidationError: Method PUT not supported at http://wine-store.myshopify.com/admin/api/2020-10/customers.json"
			)
		}
	})
	it("passes config in correctly", () => {
		const res1 = shopify2.get.customers[2398840923]({ fields: "hello" }, undefined, { auth: "sudo" })
		expect(res1.method).toBe("get")
		expect(res1.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers/2398840923.json?fields=hello"
		)
		expect(res1.config.auth).toBe("sudo")
		const body4 = { key: "value" }
		const config4 = { auth: "sudo" }
		const res4 = shopify2.post.customers(body4, undefined, config4)
		expect(res4.method).toBe("post")
		expect(res4.url).toBe(
			"http://wine-store.myshopify.com/admin/api/2020-10/customers.json"
		)
		expect(res4.body).toBe(body4)
		expect(res4.config).toBe(config4)
	})
})
