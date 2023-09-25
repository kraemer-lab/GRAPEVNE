import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderLogEvent } from "redux/actions";

import { LazyLog } from "react-lazylog";
import { ScrollFollow } from "react-lazylog";

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
