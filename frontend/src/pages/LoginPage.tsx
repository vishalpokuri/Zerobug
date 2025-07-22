import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import OrContinueWithBadge from "../components/auth/OrContinueWithBadge";
import InputField from "../components/auth/InputField";
import PrimaryButton from "../components/auth/PrimaryButton";
import AuthFooter from "../components/auth/AuthFooter";
import AuthHeader from "../components/auth/AuthHeader";
import AuthGithubButton from "../components/auth/AuthGithubButton";
import { ROOT_URL } from "../utils/backendURL";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loginPromise = fetch(`${ROOT_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred");
      }
      return data;
    });

    toast.promise(loginPromise, {
      loading: "Logging in...",
      success: (data) => {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
        return "Logged in successfully!";
      },
      error: (err) => err.message,
    });

    setIsLoading(false);
  };

  const handleGitHubLogin = () => {
    toast.error("Github authentication is coming soon");
  };

  return (
    <div className="min-h-screen flex bg-[#141414]">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#141414]">
        <div className="w-full max-w-md space-y-8">
          <AuthHeader title="Welcome back" subtitle="Sign in to your account" />

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
              placeholder="Enter your password"
              required
            />

            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </PrimaryButton>

            <OrContinueWithBadge />

            <AuthGithubButton
              handleGitHubLogin={handleGitHubLogin}
              isLoading={isLoading}
              buttonText="Github Auth (Coming soon)"
            />
          </form>

          <AuthFooter
            text="Don't have an account?"
            linkText="Sign up"
            linkTo="/register"
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
