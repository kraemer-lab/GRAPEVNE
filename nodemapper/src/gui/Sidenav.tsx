import React from 'react';
import { NavLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import styles from 'Sidenav.module.css';
 
export const navData = [
    {
        id: 0,
        icon: <HomeIcon/>,
        text: "Home",
        link: "/"
    },
    {
        id: 1,
        icon: <TravelExploreIcon/>,
        text: "Explore",
        link: "explore"
    },
    {
        id: 2,
        icon: <BarChartIcon/>,
        text: "Statistics",
        link: "statistics"
    },
    {
        id: 3,
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
          <NavLink key={item.id} className={styles.sideitem} to={item.link}>
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
