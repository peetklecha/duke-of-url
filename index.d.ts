export declare const PARAM: unique symbol;
export declare const GET: unique symbol;
export declare const PUT: unique symbol;
export declare const POST: unique symbol;
export declare const DELETE: unique symbol;
export declare const END: unique symbol;
export declare const FORMAT: unique symbol;
export declare const QUERY: unique symbol;
export declare const BODY: unique symbol;

type ParamSymbol = typeof PARAM;
type EndSymbol = typeof END;
type IntransitiveSymbol = typeof GET | typeof DELETE;
type TransitiveSymbol = typeof PUT | typeof POST;
type MethodSymbol = IntransitiveSymbol | TransitiveSymbol;

type Intransitive = (url: string, ...args: unknown[]) => unknown
type Transitive = (url: string, body: any, ...args: unknown[]) => unknown

interface Client {
	get: Intransitive,
	put: Transitive,
	post: Transitive,
	delete: Intransitive
}

interface UrlMakerConfigWithoutApi {
	head?: string,
	tail?: string,
	routeFormat?: (str: string) => string,
	queryFormat?: (raw: object) => object,
	log?: ((str: string) => string) | boolean
}

interface UrlMakerConfig<ApiType extends Api> extends UrlMakerConfigWithoutApi {
	api: ApiType,
}

interface ReqMakerConfig<Response> extends UrlMakerConfigWithoutApi {
	responseFormat?: (res: Promise<Response>) => unknown,
	bodyFormat?: (raw: unknown) => unknown,
	client: Client
}

interface ReqMakerConfigWithApi<
	ApiType extends ApiWithMethods,
	Response,
	> extends ReqMakerConfig<Response> {
	api: ApiType
}

type PayloadValidatorFunction = (payload: any) => boolean;

interface PayloadValidatorObject {
	[key: string]: unknown[] | boolean | PayloadValidatorFunction
}

type AnonymousQueryValidator = boolean | Array<string> | PayloadValidatorFunction
type QueryValidator = AnonymousQueryValidator | PayloadValidatorObject;

type PayloadDifferentiator = {
	[QUERY]: QueryValidator
	[BODY]: QueryValidator
}

type PayloadValidator = QueryValidator | PayloadDifferentiator

interface ApiAtEndpoint {
	[route: string]: Api | AnonymousQueryValidator
	[END]: QueryValidator
	[PARAM]?: Api | AnonymousQueryValidator
	[FORMAT]?: string | ((str: string) => string)
}

interface Api {
	[route: string]: Api | AnonymousQueryValidator
	[END]?: QueryValidator
	[PARAM]?: Api | AnonymousQueryValidator
	[FORMAT]?: string | ((str: string) => string)
}

interface ApiWithMethods {
	[route: string]: ApiWithMethods
	[PARAM]?: ApiWithMethods
	[FORMAT]?: string | ((str: string) => string)
}

export type ApiWithMethodsAtEndpoint = ApiWithMethods & (
	| { [GET]: PayloadValidator }
	| { [PUT]: PayloadValidator }
	| { [POST]: PayloadValidator }
	| { [DELETE]: PayloadValidator }
)

type Guard<T> = (input: any) => input is T

type ValidPayload<T extends QueryValidator> = T extends true
	? any
	: T extends false
	? never
	: T extends Guard<infer U>
	? U
	: T extends PayloadValidatorFunction
	? any
	: T extends PayloadValidatorObject
	? { [
		Property in keyof T
		as Property extends string
		? Property
		: never
		]?: T[Property] extends Guard<infer U> ? U : any }
	: any

type Endpoint<T extends QueryValidator> = (
	query?: ValidPayload<T>
) => string;

type UrlMakerWithoutApi = {
	(query?: object): string
	[key: string]: UrlMakerWithoutApi
}

type UrlMaker<ApiType> = {
	[
	Property
	in keyof ApiType
	as Property extends ParamSymbol
	? string | number
	: Property extends string
	? Property
	: never
	]: ApiType[Property] extends ApiAtEndpoint
	? Endpoint<ApiType[Property][EndSymbol]> & UrlMaker<ApiType[Property]>
	: ApiType[Property] extends QueryValidator
	? Endpoint<ApiType[Property]>
	: UrlMaker<ApiType[Property]>
}

type ReqMakerEndpoint<
	Method extends MethodSymbol,
	T extends PayloadValidator,
	Response,
	> = (
		queryOrBody?:
			T extends PayloadDifferentiator
			? MethodSymbol extends IntransitiveSymbol
			? T[typeof QUERY] extends false
			? ValidPayload<T[typeof BODY]>
			: ValidPayload<T[typeof QUERY]>
			: T[typeof BODY] extends false
			? ValidPayload<T[typeof QUERY]>
			: ValidPayload<T[typeof BODY]>
			: ValidPayload<T>,
		bodyOrQueryOrExtraArg?:
			T extends PayloadDifferentiator
			? MethodSymbol extends TransitiveSymbol
			? T[typeof QUERY] extends false
			? never
			: T[typeof BODY] extends false
			? never
			: ValidPayload<T[typeof QUERY]>
			: unknown
			: unknown,
		...extraArgs: unknown[],
	) => Response;

export type ReqMakerMidpoint<Method extends MethodSymbol, Response, T> = T extends ApiWithMethodsAtEndpoint
	? T extends { [MethSymb in Method]: any }
	? ReqMakerEndpoint<Method, T[Method], Response>
	& ReqMakerNonTerminal<Method, Response, T>
	: never
	: ReqMakerNonTerminal<Method, Response, T>

interface ReqMakerMidpointWithoutApi<Method extends MethodSymbol, Response> extends ReqMakerEndpoint<Method, true, Response> {
	[key: string]: ReqMakerMidpointWithoutApi<Method, Response>
}

type ReqMakerWithoutApi<Response> = {
	get: ReqMakerMidpointWithoutApi<typeof GET, Response>
	put: ReqMakerMidpointWithoutApi<typeof PUT, Response>
	post: ReqMakerMidpointWithoutApi<typeof POST, Response>
	delete: ReqMakerMidpointWithoutApi<typeof DELETE, Response>
	GET: ReqMakerMidpointWithoutApi<typeof GET, Response>
	PUT: ReqMakerMidpointWithoutApi<typeof PUT, Response>
	POST: ReqMakerMidpointWithoutApi<typeof POST, Response>
	DELETE: ReqMakerMidpointWithoutApi<typeof DELETE, Response>
}

type ReqMaker<Response, ApiType> = {
	get: ReqMakerMidpoint<typeof GET, Response, ApiType>
	put: ReqMakerMidpoint<typeof PUT, Response, ApiType>
	post: ReqMakerMidpoint<typeof POST, Response, ApiType>
	delete: ReqMakerMidpoint<typeof DELETE, Response, ApiType>
	GET: ReqMakerMidpoint<typeof GET, Response, ApiType>
	PUT: ReqMakerMidpoint<typeof PUT, Response, ApiType>
	POST: ReqMakerMidpoint<typeof POST, Response, ApiType>
	DELETE: ReqMakerMidpoint<typeof DELETE, Response, ApiType>
}

type ReqMakerNonTerminal<Method extends MethodSymbol, Response, ApiType> = {
	[
	Property
	in keyof ApiType
	as Property extends ParamSymbol
	? string | number
	: Property extends string
	? Property
	: never
	]: ReqMakerMidpoint<Method, Response, ApiType[Property]>
}

declare function urlMaker<ApiType extends Api>(config: UrlMakerConfig<ApiType>): UrlMaker<ApiType>
declare function urlMaker(config?: UrlMakerConfigWithoutApi): UrlMakerWithoutApi

declare function reqMaker<
	Response,
	ApiType extends ApiWithMethods,
	>(config: ReqMakerConfigWithApi<ApiType, Response>): ReqMaker<Response, ApiType>

declare function reqMaker<
	Response,
	>(config: ReqMakerConfig<Response>): ReqMakerWithoutApi<Response>


export { urlMaker, reqMaker }

