import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import Footer from "@/components/footer";

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the developer attribution text", () => {
    render(<Footer />);

    expect(screen.getByText(/developed by/i)).toBeInTheDocument();
    expect(screen.getByText("Maruf Bepary")).toBeInTheDocument();
  });

  it("links to the developer website", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "Maruf Bepary" });
    expect(link).toHaveAttribute("href", "https://maruf-bepary.com");
  });

  it("opens the link in a new tab with noopener", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "Maruf Bepary" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a single footer landmark", () => {
    render(<Footer />);

    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  });

  it("renders exactly one link", () => {
    render(<Footer />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
