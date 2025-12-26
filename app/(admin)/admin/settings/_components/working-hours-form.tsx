"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Clock, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useFetch from "@/hooks/use-fetch";
import { getDealershipInfo, saveWorkingHours } from "@/actions/settings";
import { WorkingHourInput } from "@/types/dealership/working-hour-input";
import { DayOfWeekEnum } from "@/enums/day-of-week";

// Day names for display
const DAYS: Array<{ value: DayOfWeekEnum; label: string }> = [
  { value: DayOfWeekEnum.MONDAY, label: "Monday" },
  { value: DayOfWeekEnum.TUESDAY, label: "Tuesday" },
  { value: DayOfWeekEnum.WEDNESDAY, label: "Wednesday" },
  { value: DayOfWeekEnum.THURSDAY, label: "Thursday" },
  { value: DayOfWeekEnum.FRIDAY, label: "Friday" },
  { value: DayOfWeekEnum.SATURDAY, label: "Saturday" },
  { value: DayOfWeekEnum.SUNDAY, label: "Sunday" },
];

export const WorkingHoursForm = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHourInput[]>(
    DAYS.map((day) => ({
      dayOfWeek: day.value,
      openTime: "09:00",
      closeTime: "18:00",
      isOpen: day.value !== DayOfWeekEnum.SUNDAY,
    }))
  );

  // Custom hooks for API calls
  const { fn: fetchDealershipInfo, data: settingsData } =
    useFetch(getDealershipInfo);

  const { loading: savingHours, fn: saveHours } = useFetch(saveWorkingHours);

  // Fetch settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetchDealershipInfo();
      if (res?.success && res.data) {
        const dealership = res.data;

        // Map the working hours
        if (dealership.workingHours && dealership.workingHours.length > 0) {
          const mappedHours = DAYS.map((day) => {
            // Find matching working hour
            const hourData = dealership.workingHours?.find(
              (h) => h.dayOfWeek === day.value
            );

            if (hourData) {
              return {
                dayOfWeek: hourData.dayOfWeek,
                openTime: hourData.openTime,
                closeTime: hourData.closeTime,
                isOpen: hourData.isOpen,
              };
            }

            // Default values if no working hour is found
            return {
              dayOfWeek: day.value,
              openTime: "09:00",
              closeTime: "18:00",
              isOpen: day.value !== DayOfWeekEnum.SUNDAY,
            };
          });

          setWorkingHours(mappedHours);
        }
      }
    };

    loadSettings();
  }, [fetchDealershipInfo]);

  // Handle working hours change
  const handleWorkingHourChange = (
    index: number,
    field: keyof WorkingHourInput,
    value: string | boolean
  ) => {
    const updatedHours = [...workingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value,
    };
    setWorkingHours(updatedHours);
  };

  // Save working hours
  const handleSaveHours = async () => {
    if (!settingsData?.success || !settingsData.data?.id) {
      toast.error("No dealership found. Please create dealership info first.");
      return;
    }
    const result = await saveHours(settingsData.data.id, workingHours);
    if (result?.success) {
      toast.success("Working hours saved successfully");
      fetchDealershipInfo();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Working Hours</CardTitle>
        <CardDescription>
          Set your dealership's working hours for each day of the week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DAYS.map((day, index) => (
            <div
              key={day.value}
              className="grid grid-cols-12 gap-4 items-center py-3 px-4 rounded-lg hover:bg-slate-50"
            >
              <div className="col-span-3 md:col-span-2">
                <div className="font-medium">{day.label}</div>
              </div>

              <div className="col-span-9 md:col-span-2 flex items-center justify-end md:justify-start">
                <Checkbox
                  id={`is-open-${day.value}`}
                  checked={workingHours[index]?.isOpen}
                  onCheckedChange={(checked) => {
                    handleWorkingHourChange(index, "isOpen", checked);
                  }}
                />
                <Label
                  htmlFor={`is-open-${day.value}`}
                  className="ml-2 cursor-pointer"
                >
                  {workingHours[index]?.isOpen ? "Open" : "Closed"}
                </Label>
              </div>

              {workingHours[index]?.isOpen && (
                <>
                  <div className="col-span-5 md:col-span-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <Input
                        type="time"
                        value={workingHours[index]?.openTime}
                        onChange={(e) =>
                          handleWorkingHourChange(
                            index,
                            "openTime",
                            e.target.value
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-center col-span-2 md:col-span-1">to</div>

                  <div className="col-span-5 md:col-span-3">
                    <Input
                      type="time"
                      value={workingHours[index]?.closeTime}
                      onChange={(e) =>
                        handleWorkingHourChange(
                          index,
                          "closeTime",
                          e.target.value
                        )
                      }
                      className="text-sm"
                    />
                  </div>
                </>
              )}

              {!workingHours[index]?.isOpen && (
                <div className="col-span-11 md:col-span-8 text-gray-500 italic text-sm">
                  Closed all day
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveHours} disabled={savingHours}>
            {savingHours ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Working Hours
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
