import { MessageCircle } from "lucide-react";

interface Props {
  phone?: string;
  doctorName: string;
  className?: string;
  label?: string;
}

/**
 * Opens WhatsApp with a pre-filled Arabic booking message.
 * `phone` should be in international format without "+" (e.g. 201001234567).
 */
export function WhatsAppButton({ phone, doctorName, className = "", label = "احجز عبر واتساب" }: Props) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9]/g, "");
  const text = encodeURIComponent(`مرحبًا، أريد حجز موعد مع الدكتور ${doctorName}`);
  const href = `https://wa.me/${cleaned}?text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#1ebe5a] transition shadow-md ${className}`}
      aria-label={label}
    >
      <MessageCircle className="w-4 h-4" />
      {label}
    </a>
  );
}
