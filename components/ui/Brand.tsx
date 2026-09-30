import Link from "next/link";
import { TreePine } from "lucide-react";
import { brand } from "@/lib/config";
export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label={brand.name}>
      <span className="brand-icon">
        <TreePine size={26} />
      </span>
      <span>
        {brand.shortName}
        <small>{brand.tagline}</small>
      </span>
    </Link>
  );
}
