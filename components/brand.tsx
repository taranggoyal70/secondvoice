import Link from "next/link";
import { Waves } from "lucide-react";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="SecondVoice home">
      <Waves size={25} strokeWidth={2} />
      <span>
        SecondVoice<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
