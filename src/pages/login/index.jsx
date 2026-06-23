import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdOutlineMailLock, MdOutlineVpnKey, MdAnalytics, MdVisibilityOff, MdVisibility } from "react-icons/md";
// import { loginApi } from "../../services/loginService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

  try {
  setLoading(true);

  if (
    email !== "admin@yopmail.com" ||
    password !== "Admin@123"
  ) {
    toast.error("Invalid email or password", {
      position: "top-center",
      autoClose: 2000,
    });

    setPassword("");
    return;
  }

  localStorage.setItem(
    "user",
    JSON.stringify({
      email,
      loginTime: new Date().toISOString(),
      isLoggedIn: true,
    })
  );

  toast.success("Login successful!", {
    position: "top-center",
    autoClose: 2000,
  });

  navigate("/dashboard");
} catch (error) {
  toast.error("Something went wrong",error);
} finally {
  setLoading(false);
}
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002244] via-[#003865] to-[#002244] p-4">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#ffc000]/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#ffc000]/10 rounded-full blur-3xl -z-10 animate-pulse" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative backdrop-blur-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#ffc000] mb-4 shadow-lg">
              <MdAnalytics className="text-[#003865] text-3xl" />
            </div>
            <h1 className="text-3xl font-black text-[#003865] mb-2">Notifications Analytics</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
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
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none ${errors.email
                      ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-[#ffc000] focus:ring-2 focus:ring-[#ffc000]/20"
                    }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <MdOutlineVpnKey className="absolute left-4 top-3.5 text-slate-400 text-xl" />
                {/* <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-[#ffc000] focus:ring-2 focus:ring-[#ffc000]/20"
                  }`}
                /> */}
                <div className="relative">
                  <MdOutlineVpnKey className="absolute left-4 top-3.5 text-slate-400 text-xl" />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors({ ...errors, password: "" });
                    }}
                    className={`w-full pl-12 pr-12 py-3 rounded-lg border-2 transition-all bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none ${errors.password
                        ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-[#ffc000] focus:ring-2 focus:ring-[#ffc000]/20"
                      }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003865] transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <MdVisibilityOff size={22} />
                    ) : (
                      <MdVisibility size={22} />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-7 py-3 rounded-lg font-bold text-[#003865] bg-[#ffc000] hover:bg-[#e6ac00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
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