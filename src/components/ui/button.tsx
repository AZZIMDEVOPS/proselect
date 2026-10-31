import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-[#00447B] text-white shadow-sm hover:bg-[#002545] hover:shadow-md",
        accent: "bg-[#C9A227] text-[#002545] font-bold shadow-sm hover:bg-[#B68E1E] hover:shadow-md",
        gold: "bg-[#C9A227] text-[#002545] font-bold shadow-sm hover:bg-[#B68E1E] hover:shadow-md",
        navy: "bg-[#00447B] text-white shadow-sm hover:bg-[#002545]",
        outline: "border border-[#00447B]/30 bg-transparent text-[#00447B] hover:border-[#00447B] hover:bg-[#00447B] hover:text-white",
        "outline-light": "border border-white/50 bg-white/5 text-white backdrop-blur-sm hover:bg-white hover:text-[#002545]",
        light: "bg-white text-[#00447B] hover:bg-[#E8EDF2]",
        ghost: "text-[#00447B] hover:bg-[#E8EDF2] hover:text-[#002545]",
        danger: "bg-[#B91C1C] text-white hover:bg-[#991B1B]",
        link: "h-auto p-0 text-[#00447B] underline-offset-4 hover:text-[#1A6DB3] hover:underline",
      },
      size: { sm: "h-9 px-3.5", md: "h-11 px-5", lg: "h-12 px-7 text-[15px]", icon: "size-10" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
