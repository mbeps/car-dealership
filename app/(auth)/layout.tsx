/**
 * Shared layout for authentication routes.
 * Keeps sign-in, sign-up, and password reset pages visually consistent.
 *
 * @param children - Authentication route content rendered inside the wrapper
 * @returns Authentication route layout
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default AuthLayout;
