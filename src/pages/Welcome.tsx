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

  // ✅ FORCE LOGOUT STATES
  const [showForcePopup, setShowForcePopup] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${backendConfig.baseURL}${backendConfig.loginEndPoint}`,
        { username: cleanUsername, password: cleanPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      // ✅ FORCE LOGOUT CHECK
      if (response.data?.force_logout_required) {
        setPendingLogin({ username: cleanUsername, password: cleanPassword });
        setShowForcePopup(true);
        setIsLoading(false);
        return;
      }

      // ✅ NORMAL LOGIN FLOW (UNCHANGED)
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
        } catch { }

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

        setTimeout(() => {
          navigate(createPageUrl("Dashboard"), { replace: true });
        }, 100);
      } else {
        setError("Invalid username or password.");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
        "Already logged in. Please force logout or contact supervisor."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FORCE LOGOUT HANDLER
  const handleForceLogout = async () => {
    if (!pendingLogin) return;

    try {
      await axios.post(`${backendConfig.baseURL}/login/force-logout`, {
        agent_name: pendingLogin.username,
      });

      setUsername(pendingLogin.username);
      setPassword(pendingLogin.password);
      setShowForcePopup(false);

      setTimeout(() => {
        document.getElementById("login-btn")?.click();
      }, 300);
    } catch {
      setError("Force logout failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">

      {/* ✅ FORCE LOGOUT POPUP */}
      {showForcePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[350px] shadow-xl">
            <h3 className="text-lg font-bold mb-3">Agent Already Logged In</h3>
            <p className="text-sm mb-4">
              This agent is already logged in. Do you want to force logout?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowForcePopup(false)}
              >
                No
              </Button>
              <Button onClick={handleForceLogout}>
                Yes, Force Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              <img src={zeniusLogo} alt="Zenius" className="w-32 h-16 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Agent Portal</p>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </Button>
                </div>
              </div>

              <Button id="login-btn" type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




