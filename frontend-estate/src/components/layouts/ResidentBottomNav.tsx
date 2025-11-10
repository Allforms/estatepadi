import { NavLink } from "react-router-dom";
import { HomeIcon, KeyIcon, CreditCardIcon, UsersIcon, UserIcon} from "lucide-react";

const ResidentBottomNav = () => {
  const navItems = [
    { path: "/resident/dashboard", icon: <HomeIcon size={22} />, label: "Home" },
    { path: "/resident/visitor-codes", icon: <KeyIcon size={22} />, label: "Codes" },
    { path: "/resident/pay-dues", icon: <CreditCardIcon size={22} />, label: "Dues" },
    { path: "/resident/artisans-domestics", icon: <UsersIcon size={22} />, label: "Staff" },
    { path: "/resident/profile", icon: <UserIcon size={22} />, label: "Profile" },
  ];

  return (

    <nav className="fixed bottom-0 left-0 w-full bg-white border-t backdrop-blur-md border-gray-200 shadow-md z-50 flex justify-around items-center py-2 md:hidden">
      {navItems.map(({ path, icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
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

export default ResidentBottomNav;
