import noiseComplaintIcon from "@/assets/icons/noisecomplaint.png";
import suspiciousPersonIcon from "@/assets/icons/suspiciousperson.png";
import theftIcon from "@/assets/icons/theft.png";
import vandalismIcon from "@/assets/icons/vandalism.png";
import type { IncidentCategory } from "@/types/report";

export const categoryIcons: Record<IncidentCategory, string> = {
  "Suspicious Person": suspiciousPersonIcon,
  Vandalism: vandalismIcon,
  Theft: theftIcon,
  "Noise Complaint": noiseComplaintIcon,
};
