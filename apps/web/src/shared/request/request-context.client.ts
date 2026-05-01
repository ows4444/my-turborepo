export function getClientRequestContext() {
  return {
    traceId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : (() => {
            throw new Error("crypto.randomUUID is not supported in this environment");
          })(),
    locale: null,
  };
}
