import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopNav } from "@/components/header/desktop-nav";
import { MobileNav } from "@/components/header/mobile-nav";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_PORTAL_ITEM,
  MAIN_NAV_ITEMS,
} from "@/components/header/nav-items";
import { UserMenu } from "@/components/header/user-menu";

const mockPathname = vi.fn();
const mockOnSignOut = vi.fn();
const mockOnOpenSignIn = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/header/account-dialog", () => ({
  AccountDialog: ({ open }: { open: boolean }) =>
    open ? <div>account-dialog-open</div> : null,
}));

describe("nav-items data", () => {
  it("defines main nav items with expected routes and flags", () => {
    const labels = MAIN_NAV_ITEMS.map((i) => i.label);
    expect(labels).toEqual(["Home", "All Cars", "Saved", "Reservations"]);

    const saved = MAIN_NAV_ITEMS.find((i) => i.label === "Saved")!;
    expect(saved.requiresAuth).toBe(true);
    expect(saved.showInMobile).toBe(true);

    const reservations = MAIN_NAV_ITEMS.find(
      (i) => i.label === "Reservations",
    )!;
    expect(reservations.requiresAuth).toBe(true);
    expect(reservations.hideForAdmin).toBe(true);

    const home = MAIN_NAV_ITEMS.find((i) => i.label === "Home")!;
    expect(home.href).toBe("/");
    expect(home.requiresAuth).toBeUndefined();
  });

  it("defines admin nav items pointing at the admin portal", () => {
    expect(ADMIN_NAV_ITEMS.map((i) => i.label)).toEqual([
      "Dashboard",
      "Cars",
      "Test Drives",
      "Settings",
    ]);
    for (const item of ADMIN_NAV_ITEMS) {
      expect(item.href.startsWith("/admin")).toBe(true);
    }
    expect(ADMIN_PORTAL_ITEM.href).toBe(ADMIN_NAV_ITEMS[0].href);
    expect(ADMIN_PORTAL_ITEM.requiresAuth).toBe(true);
  });
});

describe("DesktopNav", () => {
  it("renders all public items for unauthenticated users", () => {
    render(<DesktopNav items={MAIN_NAV_ITEMS} isAuthenticated={false} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("All Cars")).toBeInTheDocument();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Reservations")).not.toBeInTheDocument();
  });

  it("shows auth-gated items when authenticated", () => {
    render(<DesktopNav items={MAIN_NAV_ITEMS} isAuthenticated />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Reservations")).toBeInTheDocument();
  });

  it("hides Reservations for admins but keeps other items", () => {
    render(
      <DesktopNav items={MAIN_NAV_ITEMS} isAuthenticated userRole="ADMIN" />,
    );

    expect(screen.queryByText("Reservations")).not.toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("links each visible item to its href", () => {
    render(<DesktopNav items={MAIN_NAV_ITEMS} isAuthenticated={false} />);

    expect(screen.getByRole("link", { name: /all cars/i })).toHaveAttribute(
      "href",
      "/cars",
    );
  });
});

describe("MobileNav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("renders only showInMobile items, filtered by auth", () => {
    render(<MobileNav items={MAIN_NAV_ITEMS} isAuthenticated={false} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("returns null when no items are visible", () => {
    const hiddenOnly = MAIN_NAV_ITEMS.map((i) => ({
      ...i,
      showInMobile: false,
    }));
    const { container } = render(
      <MobileNav items={hiddenOnly} isAuthenticated />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("highlights the active route", () => {
    mockPathname.mockReturnValue("/saved-cars");
    render(<MobileNav items={MAIN_NAV_ITEMS} isAuthenticated />);

    const activeLink = screen.getByRole("link", { name: /saved/i });
    expect(activeLink.className).toContain("text-blue-700");

    const inactiveLink = screen.getByRole("link", { name: /home/i });
    expect(inactiveLink.className).not.toContain("text-blue-700");
  });

  it("hides Reservations for admins on mobile too", () => {
    render(
      <MobileNav items={MAIN_NAV_ITEMS} isAuthenticated userRole="ADMIN" />,
    );

    expect(screen.queryByText("Reservations")).not.toBeInTheDocument();
  });
});

describe("UserMenu", () => {
  const baseUser = {
    id: "user-1",
    email: "jane@example.com",
    user_metadata: { full_name: "Jane Doe" },
  } as never;

  /** Opens the avatar dropdown so its content mounts. */
  function openMenu() {
    render(
      <UserMenu
        user={baseUser}
        isAuthenticated
        onSignOut={mockOnSignOut}
        onOpenSignIn={mockOnOpenSignIn}
      />,
    );
    fireEvent.click(
      document.querySelector('[data-slot="dropdown-menu-trigger"]')!,
    );
  }

  it("shows a Login button for unauthenticated users", () => {
    render(
      <UserMenu
        user={null}
        isAuthenticated={false}
        onSignOut={mockOnSignOut}
        onOpenSignIn={mockOnOpenSignIn}
      />,
    );

    fireEventClickLogin();
  });

  function fireEventClickLogin() {
    const login = screen.getByRole("button", { name: /login/i });
    login.click();
    expect(mockOnOpenSignIn).toHaveBeenCalled();
    expect(mockOnSignOut).not.toHaveBeenCalled();
  }

  it("hides the Login button when showSignInButton is false", () => {
    render(
      <UserMenu
        user={null}
        isAuthenticated={false}
        onSignOut={mockOnSignOut}
        onOpenSignIn={mockOnOpenSignIn}
        showSignInButton={false}
      />,
    );

    expect(screen.queryByRole("button", { name: /login/i })).toBeNull();
  });

  it("shows the user's name and email in the dropdown content", () => {
    openMenu();

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("falls back to email initial avatar when no avatar url exists", () => {
    openMenu();

    expect(screen.getByText("J")).toBeInTheDocument();
    expect(screen.queryByAltText("Profile")).not.toBeInTheDocument();
  });

  it("signs out via the Sign out menu item", () => {
    openMenu();

    fireEvent.click(screen.getByText(/sign out/i));
    expect(mockOnSignOut).toHaveBeenCalled();
  });

  it("opens the account dialog from the Profile menu item", () => {
    openMenu();

    expect(screen.queryByText("account-dialog-open")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/profile/i));
    expect(screen.getByText("account-dialog-open")).toBeInTheDocument();
  });
});
