# Duke of URL

Duke of URL is a small package for constructing URLs. It can also wrap a HTTP request client like axios and be used for making requests. Its main function is to allow for this:

`http://my-store.shopify.com/admin/api/2020-10/customers/23849823/orders.json?processed_at_min=2021-09-05`

to instead be written as:

`shopify.customers[23849823].orders({processed_at_min: "2021-09-05"})`

Or, by wrapping an HTTP client like Axios, you can replace this:

`axios.get('https://my-store.shopify.com/admin/api/2020-10/customers/23849823/orders.json?processed_at_min=2021-09-05')`

With this:

`shopify.get.customers[23849823].orders({processed_at_min: "2021-09-05"})`

Additionally, Duke of URL allows you to declare an API to validate against.

## urlMaker

To just use Duke of URL for URL-construction, import the named export `urlMaker`, and create the URL maker by calling it.

```js
const { urlMaker } = require("duke-of-url")

const shopify = urlMaker()

console.log(
	shopify.customers[23849823].orders({ processed_at_min: "2021-09-05" })
)

//logs: "/customers/23849823/orders?processed_at_min=2021-09-05"
```

You can configure the head and tail of the URL by passing in a config object to `urlMaker`.

```js
const { urlMaker } = require("duke-of-url")

const shopify = urlMaker({
	head: "https://my-store.shopify.com/admin/api/2020-10",
	tail: ".json",
})

console.log(
	shopify.customers[23849823].orders({ processed_at_min: "2021-09-05" })
)

//logs: "https://my-store.shopify.com/admin/api/2020-10/customers/23849823/orders.json?processed_at_min=2021-09-05"
```

Note that by default there are no validations -- any sequence of properties can be chained from the proxy returned by `urlMaker`, and any keys and values can be included in the payload. Validations can be added to the config object, however -- see below.

A route formatting function can also be included in the config. For example, if all routes should be converted to kebab-case from camelCase during url construction.

```js
const { urlMaker } = require("duke-of-url")

const pokemon = urlMaker({
	head: "https://pokeapi.co/api/v2",
	routeFormat: myCamelToKebabFormatFunc,
})

console.log(pokemon.pokemonForm[234758]())

//logs: "https://pokeapi.co/api/v2/pokemon-form/234758"
```

Individual routes can also be customized when declaring an API -- see below.

## reqMaker

This package also exposes `reqMaker`, which wraps an HTTP client like axios.

```js
const { reqMaker } = require("duke-of-url")

const shopify = reqMaker({
	head: "https://my-store.shopify.com/admin/api/2020-10",
	tail: ".json",
	client: axios.instance({
		Authorization: "...",
	}),
})

async function main() {
	return await shopify.get.customers[23849823].orders({
		processed_at_min: "2021-09-05",
	})
	//equivalent to: await axios.get("https://my-store.shopify.com/admin/api/2020-10/customers/23849823/orders.json?processed_at_min=2021-09-05")
}
```

Methods can also be all caps.

```js
await shopify.GET.customers[23849823].orders()
```

Note that payloads are automatically formatted as queries for GET and DELETE, but for POST or PUT they are treated as request bodies and passed in as the second argument to the request client. A second argument can be supplied which will be formatted into a query for POST or PUT routes, or passed into the client unformatted for GET or DELETE routes. Note that any subsequent arguments after the first two will be passed directly into the client.

```js
const myApi = reqMaker({ client: axios })

myApi.put.chihuahuas({ favorite: true }, { color: grey })
// === axios.put("/chihuahuas?color=grey", { favorite: true })
```

This behavior can be altered when declaring a target API; see Validations below.

A response formatter function can be included in the config to automatically format responses.

```js
const shopify = reqMaker({
	head: "https://my-store.shopify.com/admin/api/2020-10",
	tail: ".json",
	client: axios.instance({
		Authorization: "...",
	}),
	responseFormat: async res => (await res).data,
})

async function main() {
	return await shopify.get.customers[23849823].orders({
		processed_at_min: "2021-09-05",
	})
	//equivalent to: return (await axios.get("...")).data
}
```

Automatic logging of the outbound URL can also be enabled by adding the property `log` to the config with a value of `true`. A function of type `string => string` can also be provided as the value of `log`; the outbound URL will be passed into this function, and the output will be `console.log`ed.

## Validations

Both the `reqMaker` and `urlMaker` functions allow declaration of the target API against which URLs can be validated (in the case of `reqMaker`, before the request is made). When using `reqMaker`, validations can distinguish between methods.

Here is a simple case:

```js
const myApi = urlMaker({
	api: {
		chihuahuas: true,
		dolphins: true,
		eagles: false,
	},
})

console.log(myApi.chihuahuas({ color: grey }))
// logs: "/chihuahuas?color=grey"
console.log(myApi.chihuahuas.puppies())
// throws "Branch puppies not defined for route /chihuahuas"
```

Here we have defined an api with three endpoints: `"/chihuahuas"`, `"/dolphins"`, and `"/eagles"`. By putting `true` as the value `"/chihuahuas"` and `"/dolphins"`, we have indicated that queries are permitted for these endpoints, but not for `"/eagles"`.

If we wanted to add the endpoint `"/chihuahuas/puppies"`, (while keeping `"/chihuahuas"` as a valid endpoint as well) we would do the following:

```js
const { urlMaker, END } = require("duke-of-url")

const myApi = urlMaker({
	api: {
		chihuahuas: {
			[END]: true,
			puppies: true,
		},
		dolphins: true,
		eagles: true,
	},
})
```

Removing `[END]: true,` would mean that `"/chihuahuas/puppies"` is a valid endpoint but `"/chihuahuas"` is not.

To add a parametric endpoint, use the `PARAM` symbol export.

```js
const { urlMaker, END, PARAM } = require("duke-of-url")

const myApi = urlMaker({
	api: {
		chihuahuas: {
			[END]: true,
			puppies: true,
		},
		dolphins: {
			[END]: true,
			[PARAM]: true,
		},
		eagles: true,
	},
})
```

If a specific route should be formatted in a specific way, that can be specified on an endpoint as well. This will override the `routeFormat` function if one is provided.

```js
const myApi = urlMaker({
	api: {
		chihuahuas: {
			[END]: true,
			puppies: true,
		},
		dolphins: {
			[FORMAT]: "odontoceti/delphinidae",
			[END]: true,
			[PARAM]: true,
		},
		eagles: true,
	},
})

myApi.dolphins[92834809238]() //=== "/odontoceti/delphinidae/92834809238"
```

Query validations can be provided as well. One way to do this is by providing a custom query validating function; this will apply before stringification of the query object. Alternately, an array of valid query keys can be provided; any value will be accepted for valid keys. Third, a an object can be provided whose keys correspond to valid query keys, and whose values can either be `true` (any value permitted), an array of permissible values, or a validating function.

```js
const myApi = urlMaker({
	api: {
		chihuahuas: myChihuahuaQueryValidator //custom validating function
		dolphins: ["color", "name", "age"], //array of permissible keys; any values allowed
		eagles: {
			[END]: {
				color: ["white", "gold", "red"], //key with array of permissible values
				name: true, //key with any value allowed
				age: Number.isFinite //key with validating function for values
			} // no other keys permitted
		}
	}
})

```

Note that when using an object of key/validator pairs as a query validator, this must be nested under the `[END]` symbol to distinguish the query validation from a description of further endpoints.

All of this works the same with `reqMaker`, except that the `END` symbol should be replaced by the method symbols `GET`, `PUT`, `POST`, and `DELETE`.  Validators on `PUT` and `POST` routes will be applied to the payload, i.e., the request body instead of the query.

If a route should support both queries and request bodies, and we want distinct validators for both, this can be done like in this example:

```js
const axios = require("axios")
const { reqMaker, PUT, GET, QUERY, BODY } = require("duke-of-url")

const myApi = reqMaker({
	head: "https://my.api/v1",
	client: axios,
	api: {
		chihuahuas: {
			[PUT]: {
				[QUERY]: myChihuahuaQueryValidator,
				[BODY]: myChihuahuaBodyValidator
			}
			[GET]: myChihuahuaQueryValidator
		}
	}
})

```

Adding `[BODY]: false` (as well as the `[QUERY]` key with any validation) to a `PUT` or `POST` route will override the normal behavior and cause the first argument to the proxy to be formatted as a query; likewise adding `[QUERY]: false` (as well as the `[BODY]` key with any validation) to a `GET` or `DELETE` route will cause the first argument to the proxy to be treated as a request body.

```js
const myApi = reqMaker({
	head: "https://my.api/v1",
	client: myClient,
	api: {
		users: {
			[GET]: {
				[QUERY]: false,
				[BODY]: true,
			},
			[PARAM]: {
				[PUT]: {
					[BODY]: false,
					[QUERY]: true,
				},
			},
		},
	},
})

myApi.get.users({ id: 47 })
// === myClient.get("/users", {id: 47})
myApi.put.users[47]({ name: "fred" })
// === myClient.put("/users/47?name=fred")
```

When passing extra args to a put or post endpoint (or a get/delete endpoint with queries disabled and bodies enabled), there is a small subtle distinction between the extra args and the body.

```js
const myClient = reqMaker({
	client: axios,
})

myClient.get.some.end.point({}, { auth })
// === axios.post('/some/end/point', { auth })

myClient.get.some.end.point({}, undefined, { auth })
// === axios.post('/some/end/point', { auth })

```

In the first case above, `{ auth }` is considered a 'body', whereas in the second case it is considered an extra argument. Because the body is left explicitly undefined in the second case, this works out the same. But there is a small difference: Only in the first case would the extra argument be passed through the `bodyFormat` func, if provided.

```js
const myClient = reqMaker({
	client: axios,
	bodyFormat: body => ({ ...body, brandId })
})

myClient.get.some.end.point({}, { auth })
// === axios.get('/some/end/point', { auth, brandId })

myClient.get.some.end.point({}, undefined, { auth })
// === axios.get('/some/end/point', { auth })

```

## Typescript

Type information is now provided by the library. If you provide an explicit API, your IDE should lint your code appropriately.

```js
function isLimit(value: unknown): value is number {
	if (value == null) return false
	const num = parseInt(value.toString())
	return !Number.isNaN(num) && num > 0 && num <= 250
}

const shopify = urlMaker({
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
console.log(shopify.customers({ limit: 'none' }));
//                              ~~~~~~ Type 'string' is not assignable to type 'number'.
console.log(shopify.customers({ ids: ['a', 'b'], other: 'hi' }));
//                                               ~~~~~~~~~~~ "Object literal may only specify known properties, and 'other' does not exist in type..."
console.log(shopify.customers[347].orders());
//                                 ~~~~~~ "Property 'orders' does not exist on type 'Endpoint<{ [END]: string[]; account_activation_url: false; send_invite: false; orders: true; }>'"
```

Note that if you provide validating functions for individual payload attributes, and you make these functions type guards (e.g., `value is number` as seen in `isLimit` above), then Duke of URL's typings will apply it to the payload in relevant cases.

There are a few caveats, though. First of all, Typescript can't validate query keys that are listed using the array-of-valid-keys method (since the content of an array value is not statically determinable). So it will always type the values of queries and bodies as `any` unless a type guard validating function is used.

Second, while it would be nice for reqMaker to automatically infer the type of responses based on the response type of the client passed into the reqMaker config, this doesn't seem to be possible, at least not with Axios, given the specific way that Axios's types are configured. So you'll need to declare the response type when you invoke reqMaker by passing it in as a type parameter. Additionally, because Typescript does not currently support partial type parameter inference, you'll need to explicitly specify the type of your API if you are specifying one.

```js
//with API specified
const config = { api: { ... } }

const api = reqMaker<AxiosPromise, typeof config.api>(config)

//no API specified, config inline
const api = reqMaker<AxiosPromise>({ ... })
```

It should be possible to infer types automatically if you use `responseFormat`, but this has not yet been implemented, so for now you should simply pass in the return type of `responseFormat` if you are using it.

