import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StorageMeter } from "@/components/admin/storage-meter";

const mockGetStorageUsage = vi.fn();

vi.mock("@/actions/storage/get-storage-usage", () => ({
  getStorageUsage: () => mockGetStorageUsage(),
}));

const GB = 1024 * 1024 * 1024;

describe("StorageMeter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default limit is 50 GB (lib/env.ts default)
  });

  it("shows a loading skeleton before usage resolves", () => {
    mockGetStorageUsage.mockReturnValue(new Promise(() => {}));

    const { container } = render(<StorageMeter />);

    expect(screen.queryByText("Storage Usage")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders usage and limit after fetching", async () => {
    mockGetStorageUsage.mockResolvedValue(10 * GB);

    render(<StorageMeter />);

    await waitFor(() => {
      expect(
        screen.getByText((_, el) => el?.textContent === "10.00 GB / 50.00 GB"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Storage Usage")).toBeInTheDocument();
  });

  it("shows the primary variant below 70% usage", async () => {
    mockGetStorageUsage.mockResolvedValue(10 * GB); // 20%

    render(<StorageMeter />);

    await waitFor(() => {
      expect(screen.getByText("20.0%")).toBeInTheDocument();
    });
    expect(document.querySelector(".bg-primary")).toBeInTheDocument();
    expect(document.querySelector(".bg-amber-500")).toBeNull();
    expect(document.querySelector(".bg-destructive")).toBeNull();
  });

  it("shows the amber secondary variant between 70% and 90%", async () => {
    mockGetStorageUsage.mockResolvedValue(40 * GB); // 80%

    render(<StorageMeter />);

    await waitFor(() => {
      expect(screen.getByText("80.0%")).toBeInTheDocument();
    });
    expect(document.querySelector(".bg-amber-500")).toBeInTheDocument();
    expect(document.querySelector(".bg-destructive")).toBeNull();
  });

  it("shows the destructive variant at or above 90%", async () => {
    mockGetStorageUsage.mockResolvedValue(48 * GB); // 96%

    render(<StorageMeter />);

    await waitFor(() => {
      expect(screen.getByText("96.0%")).toBeInTheDocument();
    });
    expect(document.querySelector(".bg-destructive")).toBeInTheDocument();
  });

  it("caps the percentage at 100% and formats tiny values", async () => {
    mockGetStorageUsage.mockResolvedValue(60 * GB); // 120% of limit

    render(<StorageMeter />);

    await waitFor(() => {
      expect(screen.getByText("100.0%")).toBeInTheDocument();
    });
  });
});
