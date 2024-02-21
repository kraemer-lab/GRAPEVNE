import { useTheme } from '@mui/material/styles';
import React from 'react';
import { LazyLog, ScrollFollow } from 'react-lazylog';
import { builderLogEvent } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

const builderAPI = window.builderAPI;

// Ensure we only mount the log listener once
let log_listener_mounted = false;

const Logger = () => {
  const logtext = useAppSelector((state) => state.builder.logtext);
  const dispatch = useAppDispatch();
  const theme = useTheme();

  if (!log_listener_mounted && builderAPI !== undefined) {
    // ensure this is only run once
    builderAPI.logEvent((event, data) => {
      dispatch(builderLogEvent(data));
    });
    log_listener_mounted = true;
  }

  return (
    <ScrollFollow
      startFollowing={true}
      render={({ follow, onScroll }) => (
        <>
          <LazyLog
            text={logtext}
            follow={follow}
            onScroll={onScroll}
            style={{
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
            }}
            /*enableSearch={true} // this enables search, but requires style overrides*/
            stream
          />
        </>
      )}
    />
  );
};

export default Logger;
