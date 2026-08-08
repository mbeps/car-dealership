import { SettingsForm } from "./_components/settings-form";

/**
 * Settings page metadata.
 * Describes the admin route for dealership configuration.
 */
export const metadata = {
  title: "Settings",
  description: "Manage dealership working hours and admin users",
};

/**
 * Admin settings page for dealership configuration.
 * Delegates contact details, working hours, admin users, and home content editing.
 *
 * @returns Settings page with dealership configuration tabs
 */
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm />
    </div>
  );
}
