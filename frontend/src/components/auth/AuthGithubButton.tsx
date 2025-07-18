import { GithubIcon } from "../../Svg/Icons";

interface AuthGithubButtonProps {
  handleGitHubLogin: () => void;
  isLoading: boolean;
  buttonText?: string;
}

function AuthGithubButton({
  handleGitHubLogin,
  isLoading,
  buttonText = "Sign in with GitHub",
}: AuthGithubButtonProps) {
  return (
    <button
      type="button"
      onClick={handleGitHubLogin}
      disabled={isLoading}
      className="w-full py-3 px-4 border border-gray-600 hover:border-gray-500 text-gray-200 font-medium rounded-lg btn-hover disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 hover:bg-[#1e1e1e] font-rm"
    >
      <GithubIcon />
      {buttonText}
    </button>
  );
}

export default AuthGithubButton;
