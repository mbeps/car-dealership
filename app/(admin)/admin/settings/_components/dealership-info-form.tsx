"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Loader2, Upload, Trash2 } from "lucide-react";

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
import { getDealershipInfo } from "@/actions/settings/get-dealership-info";
import { removeDealershipLogo } from "@/actions/settings/remove-dealership-logo";
import { updateDealershipInfo } from "@/actions/settings/update-dealership-info";
import { updateDealershipLogo } from "@/actions/settings/update-dealership-logo";
import {
  dealershipInfoSchema,
  DealershipInfoFormData,
} from "@/schemas/dealership-info";
import {
  getMimeTypeFromFileName,
  getLogoExtensionFromFileName,
  MAX_BYTES_ICO,
  MAX_BYTES_PNG_JPEG,
  MAX_BYTES_SVG,
  type LogoExtension,
} from "@/schemas/logo-upload";
import { resolveHeaderLogoSrc } from "@/lib/branding/resolve-header-logo-src";

const ACCEPTED_FILE_TYPES = ".png,.jpg,.jpeg,.ico,.svg";

/** Maximum logo size in bytes for the selected file type. */
function getClientMaxBytes(extension: LogoExtension): number {
  if (extension === "png" || extension === "jpg" || extension === "jpeg") {
    return MAX_BYTES_PNG_JPEG;
  }

  if (extension === "ico") {
    return MAX_BYTES_ICO;
  }

  return MAX_BYTES_SVG;
}

/**
 * Client form for dealership contact details and branding.
 * Loads settings on mount, validates logo uploads, and persists changes.
 *
 * @returns Dealership settings editor with logo upload and removal controls
 * @see updateDealershipInfo for contact information updates
 * @see updateDealershipLogo for logo uploads
 * @see removeDealershipLogo for logo removal
 */
export const DealershipInfoForm = () => {
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Custom hooks for API calls
  const { fn: fetchDealershipInfo, data: settingsData } =
    useFetch(getDealershipInfo);

  const { loading: updatingDealership, fn: updateDealership } =
    useFetch(updateDealershipInfo);

  const { loading: uploadingLogo, fn: uploadLogo } =
    useFetch(updateDealershipLogo);
  const { loading: removingLogo, fn: removeLogo } =
    useFetch(removeDealershipLogo);

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

        setSelectedLogoFile(null);
        setLogoPreview(
          resolveHeaderLogoSrc({
            logoUrl: dealership.logoUrl,
            logoVersion: dealership.logoVersion,
          }),
        );
      }
    };

    loadSettings();
  }, [fetchDealershipInfo, reset]);

  const currentLogoSrc = useMemo(() => {
    if (selectedLogoFile && logoPreview) {
      return logoPreview;
    }

    if (settingsData?.success && settingsData.data) {
      return resolveHeaderLogoSrc({
        logoUrl: settingsData.data.logoUrl,
        logoVersion: settingsData.data.logoVersion,
      });
    }

    return "/logo.png";
  }, [logoPreview, selectedLogoFile, settingsData]);

  /**
   * Validate and preview a selected logo file before upload.
   *
   * @param event - Logo input change event
   * @returns Nothing
   */
  const onLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const extension = getLogoExtensionFromFileName(file.name);
    if (!extension) {
      toast.error(
        "Unsupported file extension. Use png, jpg, jpeg, ico or svg.",
      );
      event.target.value = "";
      return;
    }

    const maxBytes = getClientMaxBytes(extension);
    if (file.size > maxBytes) {
      toast.error(`File is too large. Maximum allowed is ${maxBytes} bytes.`);
      event.target.value = "";
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result;
      if (typeof result !== "string") {
        toast.error("Could not preview selected file.");
        return;
      }

      setSelectedLogoFile(file);
      setLogoPreview(result);
    };

    fileReader.onerror = () => {
      toast.error("Failed to read selected file.");
    };

    fileReader.readAsDataURL(file);
  };

  /**
   * Upload the selected logo file to the current dealership.
   *
   * @returns Nothing
   */
  const onUploadLogo = async () => {
    if (!selectedLogoFile) {
      toast.error("Please select a file first.");
      return;
    }

    if (!settingsData?.success || !settingsData.data?.id) {
      toast.error("No dealership found.");
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }

          reject(new Error("Could not read file payload."));
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(selectedLogoFile);
      });

      const inferredMimeType = getMimeTypeFromFileName(selectedLogoFile.name);

      const result = await uploadLogo(settingsData.data.id, {
        name: selectedLogoFile.name,
        type: selectedLogoFile.type || inferredMimeType || "",
        dataUrl,
      });

      if (result?.success) {
        toast.success("Logo updated successfully");
        setSelectedLogoFile(null);
        await fetchDealershipInfo();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload logo.";
      toast.error(errorMessage);
    }
  };

  /**
   * Remove the current dealership logo and refresh settings.
   *
   * @returns Nothing
   */
  const onRemoveLogo = async () => {
    if (!settingsData?.success || !settingsData.data?.id) {
      toast.error("No dealership found.");
      return;
    }

    const result = await removeLogo(settingsData.data.id);
    if (result?.success) {
      toast.success("Logo removed successfully");
      setSelectedLogoFile(null);
      setLogoPreview(null);
      await fetchDealershipInfo();
    }
  };

  /**
   * Save dealership contact details for the current dealership.
   *
   * @param data - Validated dealership information form values
   * @returns Nothing
   */
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
            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-1">
                <Label htmlFor="logo">Dealership Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Supported formats: PNG, JPG/JPEG, ICO, SVG.
                </p>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 flex items-center gap-4">
                <Image
                  src={currentLogoSrc}
                  alt="Current dealership logo"
                  width={220}
                  height={56}
                  className="h-14 w-auto max-w-55 object-contain"
                  unoptimized={/\.svg($|\?)/i.test(currentLogoSrc)}
                />
                <div className="text-xs text-muted-foreground">
                  <div>Current logo preview</div>
                  <div>Static fallback is always kept as a backup.</div>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  id="logo"
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={onLogoFileChange}
                />
                <div className="text-xs text-muted-foreground">
                  PNG/JPG up to 1MB, ICO/SVG up to 256KB.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onUploadLogo}
                  disabled={uploadingLogo || !selectedLogoFile}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onRemoveLogo}
                  disabled={removingLogo}
                >
                  {removingLogo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Uploaded Logo
                    </>
                  )}
                </Button>
              </div>
            </div>

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
