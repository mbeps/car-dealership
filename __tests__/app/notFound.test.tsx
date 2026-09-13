import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";
import { ROUTES } from "@/config/routes";

describe("Root NotFound", () => {
  it("renders 404 title and message", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Page Not Found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/page you're looking for doesn't exist/i),
    ).toBeInTheDocument();
  });

  it("provides links to return home and browse cars", () => {
    render(<NotFound />);

    const returnHomeLink = screen.getByRole("link", { name: "Return Home" });
    expect(returnHomeLink).toBeInTheDocument();
    expect(returnHomeLink).toHaveAttribute("href", ROUTES.HOME.HOME);

    const browseCarsLink = screen.getByRole("link", { name: "Browse Cars" });
    expect(browseCarsLink).toBeInTheDocument();
    expect(browseCarsLink).toHaveAttribute("href", ROUTES.HOME.CARS);
  });
});
