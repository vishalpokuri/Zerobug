import { useState } from "react";
import { useNavigate } from "react-router-dom";

import OrContinueWithBadge from "../components/auth/OrContinueWithBadge";
import InputField from "../components/auth/InputField";
import PrimaryButton from "../components/auth/PrimaryButton";
import AuthFooter from "../components/auth/AuthFooter";
import AuthHeader from "../components/auth/AuthHeader";
import AuthGithubButton from "../components/auth/AuthGithubButton";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);

    // Simulate registration
    setTimeout(() => {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    }, 1000);
  };

  const handleGitHubSignup = () => {
    setIsLoading(true);
    // Simulate GitHub OAuth
    setTimeout(() => {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("githubConnected", "true");
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-[#141414]">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#141414]">
        <div className="w-full max-w-md space-y-8">
          <AuthHeader
            title="Create account"
            subtitle="Start debugging APIs today"
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <InputField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />

            <InputField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />

            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </PrimaryButton>

            <OrContinueWithBadge />

            <AuthGithubButton
              handleGitHubLogin={handleGitHubSignup}
              isLoading={isLoading}
              buttonText="Sign up with GitHub"
            />
          </form>

          <AuthFooter
            text="Already have an account?"
            linkText="Sign in"
            linkTo="/login"
          />
        </div>
      </div>

      {/* Right side - Background image/illustration */}
      <div className="flex-1 overflow-hidden">
        <img
          src="/loginPageImage.jpg"
          alt=""
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
}
