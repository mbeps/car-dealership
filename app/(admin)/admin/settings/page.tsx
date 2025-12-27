import { SettingsForm } from "./_components/settings-form";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

export const metadata = {
  title: `Settings | ${DEALERSHIP_NAME} Admin`,
  description: "Manage dealership working hours and admin users",
};

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm />
    </div>
  );
}
