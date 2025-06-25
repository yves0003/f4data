import { SVGProps } from "react";
type listIcon = "all" | "tables" | "vars" | "maps";

interface IconsProps extends SVGProps<SVGSVGElement> {
  icon: listIcon;
}

export const Icons = ({ icon, ...props }: IconsProps) => {
  switch (icon) {
    case "vars":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
          <path d="M8 11h8" />
          <path d="M8 7h6" />
        </svg>
      );

    case "tables":
      return (
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          strokeWidth={1.5}
          {...props}
        >
          <path
            d="M5 12V18C5 18 5 21 12 21C19 21 19 18 19 18V12"
            stroke="currentColor"
            strokeWidth="1.5"
          ></path>
          <path
            d="M5 6V12C5 12 5 15 12 15C19 15 19 12 19 12V6"
            stroke="currentColor"
            strokeWidth="1.5"
          ></path>
          <path
            d="M12 3C19 3 19 6 19 6C19 6 19 9 12 9C5 9 5 6 5 6C5 6 5 3 12 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
          ></path>
        </svg>
      );

    case "maps":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M15 18H3" />
          <path d="M17 6H3" />
          <path d="M21 12H3" />
        </svg>
      );

    case "all":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      );
    default:
      return <></>;
  }
};
