import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLoading from "@/app/loading";

describe("Root Loading", () => {
  it("renders a spinner with accessible status role", () => {
    render(<RootLoading />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
