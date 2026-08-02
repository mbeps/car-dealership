import { ROUTES } from "@/constants/routes";
import { createSignInRedirect } from "@/lib/route/createSignInRedirect";

describe("createSignInRedirect", () => {
  it("returns sign-in path with encoded redirect", () => {
    const redirect = "/cars/abc?make=tesla&featured=true";
    const url = createSignInRedirect(redirect);

    expect(url).toBe(
      `${ROUTES.AUTH.SIGN_IN}?redirect=${encodeURIComponent(redirect)}`,
    );
  });
});
