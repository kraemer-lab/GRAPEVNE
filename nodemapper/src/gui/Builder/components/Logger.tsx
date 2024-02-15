import React from 'react';
import { builderLogEvent } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import { LazyLog, ScrollFollow } from 'react-lazylog';

const builderAPI = window.builderAPI;

// Ensure we only mount the log listener once
let log_listener_mounted = false;

const Logger = () => {
  const logtext = useAppSelector((state) => state.builder.logtext);
  const dispatch = useAppDispatch();

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
        <LazyLog text={logtext} stream follow={follow} onScroll={onScroll} />
      )}
    />
  );
};

export default Logger;
