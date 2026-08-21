import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/reveal";

export function GlobalCustomerNotice() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-4 border-b border-border/50">
        <Reveal>
          <p className="text-center text-[10px] text-muted-foreground/80 leading-relaxed">
            Buying from outside India? See our{" "}
            <Link 
              to="/global-customers" 
              className="font-medium text-foreground/90 underline underline-offset-2 hover:text-amber transition-colors"
            >
              Global Customers
            </Link>{" "}
            guide before ordering.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
