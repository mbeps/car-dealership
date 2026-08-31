import { Mail, MessageCircle, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SerializedDealershipInfo } from "@/types/dealership/serialized-dealership-info";

export interface CarInquiryCardProps {
  dealership: SerializedDealershipInfo | null;
}

/**
 * Renders contact links for emailing, calling, or messaging the dealership via WhatsApp.
 */
export function CarInquiryCard({ dealership }: CarInquiryCardProps) {
  const whatsappDigits =
    dealership?.whatsappPhone?.replace(/[^0-9]/g, "") || "";

  return (
    <Card className="my-6">
      <CardContent className="p-4">
        <h3 className="mb-4 font-semibold text-lg">Have Questions?</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Email Button */}
          <a
            href={`mailto:${dealership?.email || ""}`}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-gray-50"
          >
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-xs">Email</span>
            <span className="break-all text-center text-gray-600 text-xs">
              {dealership?.email || "N/A"}
            </span>
          </a>

          {/* Phone Button */}
          <a
            href={`tel:${dealership?.phone || ""}`}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-gray-50"
          >
            <Phone className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-xs">Phone</span>
            <span className="text-center text-gray-600 text-xs">
              {dealership?.phone || "N/A"}
            </span>
          </a>

          {/* WhatsApp Button */}
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-gray-50"
          >
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-xs">WhatsApp</span>
            <span className="text-center text-gray-600 text-xs">
              {dealership?.whatsappPhone || "N/A"}
            </span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
