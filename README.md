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

Note that by default there are no validations -- any sequence of properties can be chained from the proxy returned by `urlMaker`, and any keys and values can be passed included in the payload. Validations can be added to the config object, however -- see below.

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

Note that payloads are automatically formatted as queries for GET and DELETE, but for POST or PUT they are treated as request bodies and passed in as the second argument to the request client. A second argument can be supplied which will be formatted into a query for POST or PUT routes, or passed into the client unformatted for GET or DELETE routes.

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

Automatic logging of the outbound URL can also be enabled by adding the property `log` to the config with a value of `true`.

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

Query validations can be provided as well. One way to do this is by providing a customer query validating function; this will apply before stringification of the query object. Alternately, an array of valid query keys can be provided; any value will be accepted for valid keys. Third, a an object can be provided whose keys correspond to valid query keys, and whose values can either be `true` (any value permitted), an array of permissible values, or a validating function.

```js
const myApi = urlMaker({
		api: {
		chihuahuas: myChihuahuaQueryValidator //custom validating function
		dolphins: ["color", "name", "age"], //array of permissible keys; any values allowed
		eagles: {
			color: ["white", "gold", "red"], //key with array of permissible values
			name: true, //key with any value allowed
			age: Number.isFinite //key with validating function for values
		}
	}
})

```

All of this works the same with `reqMaker`, except that the `END` symbol can be replaced by the method symbols `GET`, `PUT`, `POST`, and `DELETE`. Using `END` indicates that a specific endpoint (and query/body validation) applies to any method. Query validators on `PUT` and `POST` routes will be applied to the payload, i.e., the request body instead of the query.

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
			[PUT]: {
				[PARAM]: {
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
