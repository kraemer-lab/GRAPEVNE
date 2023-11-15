import React from 'react';
import { NavLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import DirectionsRun from '@mui/icons-material/DirectionsRun';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import styles from 'Sidenav.module.css';
 
export const navData = [
    {
        key: 0,
        id: "btnSidenavBuilder",
        icon: <HomeIcon/>,
        text: "Builder",
        link: "/"
    },
    /*{
        id: 1,
        icon: <TravelExploreIcon/>,
        text: "Explore",
        link: "explore"
    },
    {
        id: 2,
        icon: <DirectionsRun/>,
        text: "Monitor",
        link: "monitor"
    },
    {
        id: 3,
        icon: <BarChartIcon/>,
        text: "Statistics",
        link: "statistics"
    },*/
    {
        key: 1,
        id: "btnSidenavSettings",
        icon: <SettingsIcon/>,
        text: "Settings",
        link: "settings"
    }
]

export default function Sidenav() {
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => setOpen(!open);

  return (
    <div className={open ? styles.sidenav : styles.sidenavClosed}>
      <button className={styles.menuBtn} onClick={toggleOpen}>
        { open ? <KeyboardDoubleArrowLeftIcon /> : <KeyboardDoubleArrowRightIcon /> }
      </button>
      {navData.map((item) => {
        return (
          <NavLink
            id={item.id}
            key={item.key}
            className={styles.sideitem}
            to={item.link}
          >
            {item.icon}
            <span
              className={open ? styles.linkText : styles.linkTextClosed}
            >{item.text}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
