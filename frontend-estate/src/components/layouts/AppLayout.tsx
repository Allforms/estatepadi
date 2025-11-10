// src/layouts/AppLayout.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Paths where the back arrow should not appear
  const noBackButtonPaths = [
    "/",
    "/login",
    "/register",
    "/admin/dashboard",
    "/resident/dashboard",
    "/security/dashboard",
  ];

  const showBackButton = !noBackButtonPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Back button container aligned with navbar */}
      {showBackButton && (
        <div className="p-3 pl-4 flex items-center bg-white shadow-sm z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default AppLayout;
