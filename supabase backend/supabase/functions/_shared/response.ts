export const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

export const errorResponse = (
  status: number,
  message: string,
  details?: Record<string, unknown>,
  init: ResponseInit = {},
) =>
  json(
    {
      error: {
        message,
        ...(details ? { details } : {}),
      },
    },
    { ...init, status },
  );
