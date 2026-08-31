import { LocateFixed, Mail, MapPin, Phone } from "lucide-react";
import { DayOfWeekEnum as DayOfWeek } from "@/enums/day-of-week";
import type { SerializedDealershipInfo } from "@/types/dealership/serialized-dealership-info";
import type { SerializedWorkingHour } from "@/types/dealership/serialized-working-hour";

const DAYS_ORDER = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const DEFAULT_SCHEDULE = [
  { day: DayOfWeek.MONDAY, label: "Monday" },
  { day: DayOfWeek.TUESDAY, label: "Tuesday" },
  { day: DayOfWeek.WEDNESDAY, label: "Wednesday" },
  { day: DayOfWeek.THURSDAY, label: "Thursday" },
  { day: DayOfWeek.FRIDAY, label: "Friday" },
  { day: DayOfWeek.SATURDAY, label: "Saturday" },
  { day: DayOfWeek.SUNDAY, label: "Sunday" },
];

export interface CarDealershipInfoProps {
  dealership: SerializedDealershipInfo | null;
}

/**
 * Displays dealership contact info, map link, and weekly opening hours.
 */
export function CarDealershipInfo({ dealership }: CarDealershipInfoProps) {
  const sortedWorkingHours = dealership?.workingHours
    ? [...dealership.workingHours].sort(
        (a: SerializedWorkingHour, b: SerializedWorkingHour) =>
          DAYS_ORDER.indexOf(a.dayOfWeek) - DAYS_ORDER.indexOf(b.dayOfWeek),
      )
    : null;

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-6 font-bold text-2xl">Dealership Location</h2>
      <div className="rounded-lg bg-gray-50 p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          {/* Dealership Name and Address */}
          <div className="flex w-full items-start gap-3">
            <div className="flex flex-1 flex-col gap-5 text-lg">
              <div className="flex items-start gap-3">
                <LocateFixed className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <h4 className="font-medium">{dealership?.name}</h4>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                {dealership?.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      dealership.address,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 transition-colors hover:text-blue-600 hover:underline"
                  >
                    {dealership.address}
                  </a>
                ) : (
                  <p className="text-gray-600">Not Available</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-gray-500" />
                {dealership?.phone ? (
                  <a
                    href={`tel:${dealership.phone}`}
                    className="text-gray-600 transition-colors hover:text-blue-600 hover:underline"
                  >
                    {dealership.phone}
                  </a>
                ) : (
                  <p className="text-gray-600">Not Available</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-gray-500" />
                {dealership?.email ? (
                  <a
                    href={`mailto:${dealership.email}`}
                    className="text-gray-600 transition-colors hover:text-blue-600 hover:underline"
                  >
                    {dealership.email}
                  </a>
                ) : (
                  <p className="text-gray-600">Not Available</p>
                )}
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="md:w-1/2 lg:w-1/3">
            <h4 className="mb-2 font-medium text-lg">Working Hours</h4>
            <div className="space-y-2">
              {sortedWorkingHours
                ? sortedWorkingHours.map((day: SerializedWorkingHour) => (
                    <div
                      key={day.dayOfWeek}
                      className="flex justify-between text-md"
                    >
                      <span className="text-gray-600">
                        {day.dayOfWeek.charAt(0) +
                          day.dayOfWeek.slice(1).toLowerCase()}
                      </span>
                      <span>
                        {day.isOpen
                          ? `${day.openTime} - ${day.closeTime}`
                          : "Closed"}
                      </span>
                    </div>
                  ))
                : DEFAULT_SCHEDULE.map(({ day, label }, index) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span>
                        {index < 5
                          ? "9:00 - 18:00"
                          : index === 5
                            ? "10:00 - 16:00"
                            : "Closed"}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
