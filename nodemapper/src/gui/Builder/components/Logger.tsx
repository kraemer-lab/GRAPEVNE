import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderLogEvent } from "redux/actions";

import { LazyLog } from "react-lazylog";
import { ScrollFollow } from "react-lazylog";

// TODO
// This line permits any function declarations from the window.builderAPI
// as a workaround. Remove this in favour of a proper typescript-compatible
// interface. This may require modification to the electron code.
declare const window: any;

let log_listener_mounted = false;

const Logger = () => {
  const logtext = useAppSelector((state) => state.builder.logtext);
  const dispatch = useAppDispatch();
  const builderAPI = window.builderAPI;

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
