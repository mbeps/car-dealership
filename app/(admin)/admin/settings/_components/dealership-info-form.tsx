"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import useFetch from "@/hooks/use-fetch";
import { getDealershipInfo, updateDealershipInfo } from "@/actions/settings";
import {
  dealershipInfoSchema,
  DealershipInfoFormData,
} from "@/schemas/dealership-info";

export const DealershipInfoForm = () => {
  // Custom hooks for API calls
  const { fn: fetchDealershipInfo, data: settingsData } =
    useFetch(getDealershipInfo);

  const { loading: updatingDealership, fn: updateDealership } =
    useFetch(updateDealershipInfo);

  // React Hook Form for dealership info
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DealershipInfoFormData>({
    resolver: zodResolver(dealershipInfoSchema),
    defaultValues: {
      name: "",
      address: "",
      email: "",
      phone: "",
      whatsappPhone: "",
    },
  });

  // Fetch settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetchDealershipInfo();
      if (res?.success && res.data) {
        const dealership = res.data;

        // Reset form with dealership info
        reset({
          name: dealership.name || "",
          address: dealership.address || "",
          email: dealership.email || "",
          phone: dealership.phone || "",
          whatsappPhone: dealership.whatsappPhone || "",
        });
      }
    };

    loadSettings();
  }, [fetchDealershipInfo, reset]);

  // Save dealership info
  const onSubmitDealershipInfo = async (data: DealershipInfoFormData) => {
    if (!settingsData?.success || !settingsData.data?.id) {
      toast.error("No dealership found.");
      return;
    }
    const result = await updateDealership(settingsData.data.id, data);
    if (result?.success) {
      toast.success("Dealership information updated successfully");
      fetchDealershipInfo();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dealership Information</CardTitle>
        <CardDescription>
          Update your dealership's contact information and details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitDealershipInfo)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dealership Name</Label>
              <Input
                id="name"
                placeholder="Name Motors"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="69 Car Street, Autoville, CA 69420"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@vehiql.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappPhone">WhatsApp Number</Label>
              <Input
                id="whatsappPhone"
                placeholder="+1 (555) 123-4567"
                {...register("whatsappPhone")}
              />
              {errors.whatsappPhone && (
                <p className="text-sm text-red-600">
                  {errors.whatsappPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={updatingDealership}>
              {updatingDealership ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Dealership Info
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
