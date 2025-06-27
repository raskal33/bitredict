import { ReactNode } from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  children,
  onClick,
  type = "button",
  className = "",
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary text-black shadow-button hover:brightness-110 hover:scale-105 hover:shadow-button-hover focus:ring-primary/50 font-semibold",
    secondary: "bg-secondary text-white shadow-[0_4px_16px_rgba(255,0,128,0.2)] hover:brightness-110 hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,0,128,0.4)] focus:ring-secondary/50 font-semibold",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-black focus:ring-primary/50",
    ghost: "bg-transparent text-text-muted hover:bg-[rgba(255,255,255,0.05)] hover:text-text-primary focus:ring-text-accent/50",
    accent: "bg-accent text-white shadow-[0_4px_16px_rgba(140,0,255,0.2)] hover:brightness-110 hover:scale-105 hover:shadow-[0_6px_20px_rgba(140,0,255,0.4)] focus:ring-accent/50 font-semibold",
    success: "bg-success text-white shadow-lg hover:brightness-110 hover:scale-105 focus:ring-success/50",
    warning: "bg-warning text-black shadow-lg hover:brightness-110 hover:scale-105 focus:ring-warning/50",
    error: "bg-error text-white shadow-lg hover:brightness-110 hover:scale-105 focus:ring-error/50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
  };

  const widthClass = fullWidth ? "w-full" : "w-fit";

  return (
    <button
      type={type}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${widthClass}
        ${className}
        ${loading ? "cursor-wait" : ""}
      `}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
