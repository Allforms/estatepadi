import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  FileTextIcon,
  UserIcon,
} from "lucide-react";

const AdminBottomNav = () => {
  const navItems = [
    { path: "/admin/dashboard", icon: <HomeIcon size={22} />, label: "Home" },
    { path: "/admin/residents", icon: <UsersIcon size={22} />, label: "Residents" },
    { path: "/admin/payments", icon: <CreditCardIcon size={22} />, label: "Payments" },
    { path: "/admin/dues", icon: <FileTextIcon size={22} />, label: "Dues" },
    { path: "/admin/profile", icon: <UserIcon size={22} />, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-md z-50 flex justify-around items-center py-2 md:hidden">
      {navItems.map(({ path, icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs transition-colors duration-200 ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`
          }
        >
          {icon}
          <span className="mt-1">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminBottomNav;
