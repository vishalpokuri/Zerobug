import { Link } from "react-router-dom";

interface AuthFooterProps {
  text: string;
  linkText: string;
  linkTo: string;
}

export default function AuthFooter({
  text,
  linkText,
  linkTo,
}: AuthFooterProps) {
  return (
    <p className="text-center text-sm text-gray-300 font-rr">
      {text}{" "}
      <Link
        to={linkTo}
        className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
      >
        {linkText}
      </Link>
    </p>
  );
}
