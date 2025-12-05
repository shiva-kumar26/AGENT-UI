// src/pages/Welcome.tsx
import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, User, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/utils";
import { AuthContext } from "@/store/AuthContext";
import zeniusLogo from "@/images/zenius.png";
import { backendConfig, KBAuthSession } from "@/config/config";
import axios from "axios";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-clear error after 6 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isLoading) return;

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setError(""); // Clear previous errors on new attempt

    try {
      const response = await axios.post(
        `${backendConfig.baseURL}${backendConfig.loginEndPoint}`,
        { username: cleanUsername, password: cleanPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 && response.data.authenticated) {
        const {
          extension: agentId,
          user_id: userId,
          hostname,
          role = "agent",
        } = response.data;

        if (!agentId) {
          setError("Agent extension not received from server.");
          return;
        }

        // Non-blocking FreeSWITCH status update
        try {
          await axios.post(
            `${backendConfig.baseURL}${backendConfig.setAgentStatus}`,
            {
              extension: agentId,
              hostname: "10.16.7.91",
              status: "Available",
            },
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.warn("FreeSWITCH status update failed (non-blocking)", err);
        }

        // Success: Update auth state
        login({
          userId: agentId,
          userName: userId || agentId,
          password: cleanPassword,
          status: "Available",
          isAuthenticated: true,
          hostname,
          role,
          extension: agentId,
        });

        KBAuthSession.set({
          token: "shared",
          role,
          userId: userId || agentId,
          extension: agentId,
        });

        // Critical Fix: Small delay ensures auth state is committed before navigation
        setTimeout(() => {
          navigate(createPageUrl("Dashboard"), { replace: true });
        }, 100);

      } else {
        setError("Invalid username or password.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              <img src={zeniusLogo} alt="Zenius" className="w-32 h-16 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Agent Portal</p>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6" noValidate>
              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-12"
                    required
                    autoFocus
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-12 h-12"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}