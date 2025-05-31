// If you see type errors, run: npm install --save-dev @types/xterm
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export interface TerminalHandle {
  sendToTerminal: (data: string) => void;
}

interface TerminalComponentProps {
  height?: string | number;
  wsUrl: string;
  onReady?: (handle: TerminalHandle) => void;
}

const TerminalComponent = forwardRef<TerminalHandle, TerminalComponentProps>(
  ({ height = '100%', wsUrl, onReady }, ref) => {
    const xtermRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useImperativeHandle(ref, () => ({
      sendToTerminal: (data: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input', data }));
        }
      },
    }), []);

    useEffect(() => {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
        },
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      termRef.current = term;
      fitAddonRef.current = fitAddon;

      if (xtermRef.current) {
        term.open(xtermRef.current);
        fitAddon.fit();
      }

      let ws: WebSocket | null = null;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
      } catch (err) {
        term.writeln('\x1b[31mCould not connect to terminal backend.\x1b[0m');
      }

      if (ws) {
        ws.onopen = () => {
          term.focus();
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'output') {
              term.write(msg.data);
            }
          } catch (e) {
            // Ignore malformed messages
          }
        };

        ws.onerror = () => {
          term.writeln('\x1b[31mCould not connect to terminal backend.\x1b[0m');
        };

        ws.onclose = () => {
          term.writeln('\x1b[31mTerminal connection closed.\x1b[0m');
        };

        term.onData((data) => {
          ws!.send(JSON.stringify({ type: 'input', data }));
        });
      }

      // Handle terminal resize
      const handleResize = () => {
        if (fitAddonRef.current && termRef.current && ws && ws.readyState === WebSocket.OPEN) {
          fitAddonRef.current.fit();
          const cols = termRef.current.cols;
          const rows = termRef.current.rows;
          ws.send(
            JSON.stringify({ type: 'resize', cols, rows })
          );
        }
      };
      window.addEventListener('resize', handleResize);
      setTimeout(handleResize, 100);

      if (onReady) {
        onReady({
          sendToTerminal: (data: string) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'input', data }));
            }
          },
        });
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
        ws && ws.close();
      };
    }, [wsUrl, onReady]);

    return (
      <div
        ref={xtermRef}
        style={{ width: '100%', height, background: '#1e1e1e' }}
      />
    );
  }
);

export default TerminalComponent; 