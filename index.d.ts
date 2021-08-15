declare export const PARAM: unique symbol;
declare export const GET: unique symbol;
declare export const PUT: unique symbol;
declare export const POST: unique symbol;
declare export const DELETE: unique symbol;
declare export const END: unique symbol;
declare export const FORMAT: unique symbol;
declare export const QUERY: unique symbol;
declare export const BODY: unique symbol;

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

interface ReqMakerConfigWithoutApi<Response> extends UrlMakerConfigWithoutApi {
	responseFormat?: (res: Promise<Response>) => unknown,
	bodyFormat?: (raw: unknown) => unknown,
	client: Client<Response>
}

interface ReqMakerConfig<
	ApiType extends ApiWithMethods,
	Response,
	> extends ReqMakerConfigWithoutApi<Response> {
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

type ApiWithMethodsAtEndpoint = ApiWithMethods & (
	| { [GET]: PayloadValidator }
	| { [PUT]: PayloadValidator }
	| { [POST]: PayloadValidator }
	| { [DELETE]: PayloadValidator }
)

type ValidPayload<T extends QueryValidator> = T extends true
	? any
	: T extends false
	? never
	: T extends PayloadValidatorFunction
	? any
	: T extends PayloadValidatorObject
	? { [Property in keyof T]: any }
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
	]: ApiType[Property] extends QueryValidator
	? Endpoint<ApiType[Property]>
	: ApiType[Property] extends ApiAtEndpoint
	? Endpoint<ApiType[Property][EndSymbol]> & UrlMaker<ApiType[Property]>
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
	) => Promise<Response>;

type ReqMakerMidpoint<Method extends MethodSymbol, Response, T> = T extends ApiWithMethodsAtEndpoint
	? T extends { [MethSymb in Method]: any }
	? ReqMakerEndpoint<Method, T[Method], Response>
	& ReqMakerWithMethod<Method, Response, T>
	: never
	: ReqMakerWithMethod<Method, Response, T>

interface ReqMakerMidpointWithoutApi<Method extends MethodSymbol, Response> extends ReqMakerEndpoint<Method, true, Response> {
	[key: string]: ReqMakerMidpointWithoutApi<Method, Response>
}

type ReqMakerWithoutApi<Response> = {
	get: ReqMakerMidpointWithoutApi<typeof GET, Response>
	put: ReqMakerMidpointWithoutApi<typeof PUT, Response>
	post: ReqMakerMidpointWithoutApi<typeof POST, Response>
	delete: ReqMakerMidpointWithoutApi<typeof DELETE, Response>
}

type ReqMaker<Response, ApiType> = {
	get: ReqMakerMidpoint<typeof GET, Response, ApiType>
	put: ReqMakerMidpoint<typeof PUT, Response, ApiType>
	post: ReqMakerMidpoint<typeof POST, Response, ApiType>
	delete: ReqMakerMidpoint<typeof DELETE, Response, ApiType>
}

type ReqMakerWithMethod<Method extends MethodSymbol, Response, ApiType> = {
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
	>(config: ReqMakerConfig<ApiType, Response>): ReqMaker<Response, ApiType>

declare function reqMaker<
	Response,
	>(config: ReqMakerConfigWithoutApi<Response>): ReqMakerWithoutApi<Response>


export { urlMaker, reqMaker, GET, PUT, POST, DELETE, END, PARAM, FORMAT }

