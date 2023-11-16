import React from "react";
import HomeIcon from "@mui/icons-material/Home";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";

import { NavLink } from "react-router-dom";

import "./sidenav.css";

export const navData = [
  {
    id: 0,
    label: "Builder",
    icon: <HomeIcon />,
    path: "/",
  },
  {
    id: 1,
    label: "Containers",
    icon: <BarChartIcon />,
    path: "/containers",
  },
  {
    id: 2,
    label: "Settings",
    icon: <SettingsIcon />,
    path: "/settings",
  },
];

// Layout for main window, including sliding-pane support
const Sidenav = () => {
  const [open, setOpen] = React.useState(true);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <div className={open ? "sidenav" : "sidenavClosed"}>
      <button className="menuBtn" onClick={toggleOpen}>
        {open ? (
          <KeyboardDoubleArrowLeftIcon />
        ) : (
          <KeyboardDoubleArrowRightIcon />
        )}
      </button>
      {navData.map((item) => {
        return (
          <NavLink key={item.id} className="sideitem" to={item.path}>
            {item.icon}
            <span className={open ? "linkText" : "linkTextClosed"}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default Sidenav;
