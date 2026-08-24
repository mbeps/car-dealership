import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeSearch } from "@/components/home-search";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const getSearchInput = (): HTMLInputElement =>
  screen.getByPlaceholderText(/search by make/i);

const submitSearch = (term: string) => {
  fireEvent.change(getSearchInput(), { target: { value: term } });
  fireEvent.click(screen.getByRole("button"));
};

describe("HomeSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search input and submit button", () => {
    render(<HomeSearch />);

    expect(getSearchInput()).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("updates the input value as the user types", () => {
    render(<HomeSearch />);

    fireEvent.change(getSearchInput(), { target: { value: "Toyota" } });

    expect(getSearchInput().value).toBe("Toyota");
  });

  it("pushes /cars with the search query on submit", () => {
    render(<HomeSearch />);
    submitSearch("Toyota");

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/cars?search=Toyota");
  });

  it("URL-encodes multi-word search terms", () => {
    render(<HomeSearch />);
    submitSearch("blue corolla");

    expect(mockPush).toHaveBeenCalledWith("/cars?search=blue+corolla");
  });

  it("does not navigate when the search term is empty", () => {
    render(<HomeSearch />);
    submitSearch("");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate when the search term is whitespace only", () => {
    render(<HomeSearch />);
    submitSearch("   ");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("trims is not applied to the pushed value (component passes raw term)", () => {
    // ponytail: documents current behaviour — leading/trailing spaces are kept
    render(<HomeSearch />);
    submitSearch("  Toyota  ");

    expect(mockPush).toHaveBeenCalledWith("/cars?search=++Toyota++");
  });
});
