import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdOutlineMailLock, MdOutlineVpnKey } from "react-icons/md";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Fixed company credentials
  const COMPANY_EMAIL = "admin@company.com";
  const COMPANY_PASSWORD = "admin123";

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      if (email === COMPANY_EMAIL && password === COMPANY_PASSWORD) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            email,
            loginTime: new Date().toISOString(),
          })
        );

        toast.success("Login successful! Welcome back.", {
          position: "top-center",
          autoClose: 2000,
        });

        setLoading(false);
        navigate("/dashboard");
      } else {
        setLoading(false);
        toast.error("Invalid email or password", {
          position: "top-center",
          autoClose: 2000,
        });
        setPassword("");
        setErrors({ submit: "Invalid credentials" });
      }
    }, 800);
  };

  const handleDemoFill = () => {
    setEmail(COMPANY_EMAIL);
    setPassword(COMPANY_PASSWORD);
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative backdrop-blur-xl bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">⚡</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Notifications Analytics</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                Email Address
              </label>
              <div className="relative">
                <MdOutlineMailLock className="absolute left-4 top-3.5 text-slate-400 text-xl" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-600/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                Password
              </label>
              <div className="relative">
                <MdOutlineVpnKey className="absolute left-4 top-3.5 text-slate-400 text-xl" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-600/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-7 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          {/* <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400 text-xs mb-4 uppercase tracking-wider font-semibold">
              Demo Credentials
            </p>
            <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4 space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-indigo-300 font-mono text-xs">admin@company.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Password:</span>
                <span className="text-indigo-300 font-mono text-xs">admin123</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full px-4 py-2 rounded-lg border border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all text-sm font-medium"
            >
              Use Demo Credentials
            </button>
          </div> */}

          {/* Footer */}
          {/* <p className="text-center text-slate-500 text-xs mt-6">
            © 2024 BPCL Equipment Maintenance. All rights reserved.
          </p> */}
        </div>
      </div>
    </div>
  );
}