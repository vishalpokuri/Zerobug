import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import OrContinueWithBadge from "../components/auth/OrContinueWithBadge";
import InputField from "../components/auth/InputField";
import PrimaryButton from "../components/auth/PrimaryButton";
import AuthFooter from "../components/auth/AuthFooter";
import AuthHeader from "../components/auth/AuthHeader";
import AuthGithubButton from "../components/auth/AuthGithubButton";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const registerPromise = fetch(
      "https://backend.canum.xyz/api3/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      }
    ).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "An error occurred");
      }
      return data;
    });

    toast.promise(registerPromise, {
      loading: "Registering...",
      success: () => {
        navigate("/login");
        return "Registered successfully!";
      },
      error: (err) => err.message,
    });

    setIsLoading(false);
  };

  const handleGitHubSignup = () => {
    toast.error("Github authentication is coming soon");
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
              id="name"
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your Name"
              required
            />
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

            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </PrimaryButton>

            <OrContinueWithBadge />

            <AuthGithubButton
              handleGitHubLogin={handleGitHubSignup}
              isLoading={isLoading}
              buttonText="Github Auth (Coming soon)"
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
