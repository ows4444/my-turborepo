export type AppRouteHandler<TCtx = unknown> = (req: Request, ctx: TCtx) => Promise<Response> | Response;

export type MutationHandler<TCtx = unknown> = AppRouteHandler<TCtx>;
export type QueryHandler<TCtx = unknown> = AppRouteHandler<TCtx>;
