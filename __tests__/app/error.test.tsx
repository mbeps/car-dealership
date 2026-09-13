import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootError from "@/app/error";
import { ROUTES } from "@/config/routes";

describe("Root Error", () => {
  it("renders error heading, description, and action buttons", () => {
    const mockReset = vi.fn();
    const error = new Error("Test root failure");

    render(<RootError error={error} reset={mockReset} />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();

    const returnHomeLink = screen.getByRole("link", { name: /return home/i });
    expect(returnHomeLink).toBeInTheDocument();
    expect(returnHomeLink).toHaveAttribute("href", ROUTES.HOME.HOME);
  });

  it("calls reset when Try Again button is clicked", () => {
    const mockReset = vi.fn();
    const error = new Error("Test root failure");

    render(<RootError error={error} reset={mockReset} />);

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
