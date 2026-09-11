import { ROUTES } from "@/config/routes";
import { createSignInRedirect } from "@/lib/route/create-sign-in-redirect";

describe("createSignInRedirect", () => {
  it("returns sign-in path with encoded redirect", () => {
    const redirect = "/cars/abc?make=tesla&featured=true";
    const url = createSignInRedirect(redirect);

    expect(url).toBe(
      `${ROUTES.AUTH.SIGN_IN}?redirect=${encodeURIComponent(redirect)}`,
    );
  });
});
