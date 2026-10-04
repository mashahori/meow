import { describe, expect, it } from "@jest/globals";
import { UnauthorizedError } from "../../src/errors/app-error";
import { requireAuth } from "../../src/middleware/require-auth";
import { createNext, createRequest, createResponse } from "../helpers";

describe("requireAuth", () => {
  it("passes through when the session has a user", () => {
    const next = createNext();

    requireAuth(
      createRequest({ session: { userId: "user-1" } }),
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects requests without a session user", () => {
    const next = createNext();

    requireAuth(createRequest(), createResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).statusCode).toBe(401);
  });
});
