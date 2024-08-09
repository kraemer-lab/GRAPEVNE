import React, { useEffect, useRef } from 'react';
import { builderSetTerminalMounted } from 'redux/actions/builder';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

import 'xterm/css/xterm.css';

const terminalAPI = window.terminalAPI;

// local switch permits interactivity; global switch can be set to permit reloading
let terminal_mounted = false;

const TerminalWindow = (props) => {
  const xtermRef = useRef(null);
  const dispatch = useAppDispatch();
  const terminal_mounted_global = useAppSelector((state) => state.builder.terminal_mounted);
  if (!terminal_mounted_global) {
    terminal_mounted = false;
  }

  useEffect(() => {
    console.log('TerminalWindow: useEffect');
    if (terminal_mounted) return;
    if (!props.terminal || !xtermRef.current) return;

    const terminal = props.terminal;
    terminal.open(xtermRef.current);

    terminalAPI.sendData('clear\r\n');

    terminal.onData((data) => {
      terminalAPI.sendData(data);
    });
    terminalAPI.receiveData((event, data) => {
      terminal.write(data);
    });

    terminal_mounted = true;
    dispatch(builderSetTerminalMounted(true));

    return () => {
      // Cleanup
    };
  }, [props.terminal]);

  return (
    <div
      ref={xtermRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default TerminalWindow;
