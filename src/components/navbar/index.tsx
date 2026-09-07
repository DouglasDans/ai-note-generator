"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme-toggle";
import { isReservedSlug } from "@/db/reservedSlugs";

export default function Navbar() {
  const pathname = usePathname();
  const firstSegment = pathname.split("/")[1] ?? "";
  const spaceSlug = firstSegment && !isReservedSlug(firstSegment) ? firstSegment : null;

  return (
    <nav className="flex items-center justify-between pb-6">
      <div className="flex items-center gap-2">
        <Link
          href={spaceSlug ? `/${spaceSlug}` : "/"}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Home className="size-4" />
          Home
        </Link>
        {spaceSlug && (
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <LogOut className="size-4" />
            Sair
          </Link>
        )}
      </div>
      <ThemeToggle />
    </nav>
  );
}
