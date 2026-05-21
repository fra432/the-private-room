import logo from "@/assets/logo.png";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="THE ROOM — Private Hair Studio"
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}