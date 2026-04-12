export const getIpAddress = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
};

export const getUserAgent = (req: Request) => req.headers.get("user-agent") || null;

export const readJson = async <T>(req: Request): Promise<T> => {
  try {
    return await req.json();
  } catch {
    return {} as T;
  }
};
