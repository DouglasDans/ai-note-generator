import Link from "next/link";
import { Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between pb-6">
      <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        <Home className="size-4" />
        Home
      </Link>
      <ThemeToggle />
    </nav>
  );
}
