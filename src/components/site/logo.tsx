import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <Image
      src={dark ? "/brand/proselect_mark_white.png" : "/brand/proselect_mark_blue.png"}
      alt=""
      width={320}
      height={320}
      aria-hidden
      className={cn("size-10 min-w-10 shrink-0 object-contain", className)}
    />
  );
}

export function Logo({
  dark = false,
  className,
  imgClassName,
  href = "/",
  priority = false,
}: {
  dark?: boolean;
  className?: string;
  imgClassName?: string;
  href?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Proselect Fleet & Industrial Solutions Limited — Home"
      className={cn("inline-flex shrink-0 items-center py-1", className)}
    >
      <Image
        src={dark ? "/brand/proselect_logo_white.png" : "/brand/proselect_logo_blue.png"}
        alt="PROSELECT — Fleet & Industrial Solutions Limited"
        width={1024}
        height={332}
        priority={priority}
        className={cn("h-10 w-auto min-w-[124px] object-contain sm:h-11", imgClassName)}
      />
    </Link>
  );
}
