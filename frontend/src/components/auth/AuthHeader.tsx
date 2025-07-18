
interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-rbi text-white mb-2">{title}</h1>
      <p className="text-gray-300 font-rr">{subtitle}</p>
    </div>
  );
}