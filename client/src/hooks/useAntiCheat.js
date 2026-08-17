import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 1000; // backup safety net for genuinely instantaneous repeats (e.g. key auto-repeat)

/**
 * Wires up all the native browser APIs used for monitoring an exam attempt:
 * Fullscreen API, Page Visibility API, window blur, clipboard events,
 * right-click, browser refresh (keyboard + toolbar button), back-button
 * trapping, dev-tools shortcuts, and a native "leave this page?" warning.
 *
 * Tab-switch and fullscreen-exit detection are STATE-TRANSITION based
 * rather
 * than time-debounced. This is deterministic regardless of how far apart the
 * browser's own duplicate events fire, which a pure time-debounce can miss.
 *
 * onViolation(eventType, description) is called for every detected event —
 * the caller decides how to log/display it.
 */
const useAntiCheat = (active, examId, onViolation) => {
  const callbackRef = useRef(onViolation);
  callbackRef.current = onViolation;

  const lastLoggedRef = useRef({});
  const wasVisibleRef = useRef(true);
  const wasFullscreenRef = useRef(true);

  useEffect(() => {
    if (!active) return undefined;

    // Reset transition trackers each time monitoring (re)starts
    wasVisibleRef.current = !document.hidden;
    wasFullscreenRef.current = !!document.fullscreenElement;

    const report = (eventType, description) => {
      const now = Date.now();
      if (now - (lastLoggedRef.current[eventType] || 0) < DEBOUNCE_MS) return;
      lastLoggedRef.current[eventType] = now;
      callbackRef.current(eventType, description);
    };

    // ---- Tab switch: only logs on the visible -> hidden transition ----
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      if (hidden && wasVisibleRef.current) {
        report('TAB_SWITCH', 'Tab switched or window minimized');
      }
      wasVisibleRef.current = !hidden;
    };

    // Window blur is a fallback signal for focus loss that ISN'T already a
    // tab switch (e.g. alt-tabbing to another app while this tab technically
    // stays "visible" in some browsers). If the tab is already hidden, the
    // visibilitychange handler above already logged it — skip here so the
    // same physical action never counts twice.
    const handleBlur = () => {
      if (!document.hidden) {
        report('TAB_SWITCH', 'Browser window lost focus');
      }
    };

    // ---- Fullscreen exit: only logs on the fullscreen -> not transition ----
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      if (!isFs && wasFullscreenRef.current) {
        report('FULLSCREEN_EXIT', 'Exited fullscreen mode');
      }
      wasFullscreenRef.current = isFs;
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      report('RIGHT_CLICK', 'Right-click attempted');
    };

    const handleCopy = (e) => {
      e.preventDefault();
      report('COPY_ATTEMPT', 'Copy attempted');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      report('PASTE_ATTEMPT', 'Paste attempted');
    };

    const handleCut = (e) => {
      e.preventDefault();
      report('CUT_ATTEMPT', 'Cut attempted');
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // C/V/X are deliberately NOT blocked here. Blocking them at keydown
      // would prevent the browser from ever firing the actual copy/paste/cut
      // events below — which is where the real blocking AND logging happens.
      // Intercepting both places was silently swallowing the violation log.

      // Dev tools shortcuts, including view-source
      if (key === 'f12' || (ctrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(key))) {
        e.preventDefault();
        report('DEV_TOOLS_ATTEMPT', `Blocked shortcut: ${key === 'f12' ? 'F12' : `Ctrl+Shift+${key.toUpperCase()}`}`);
        return;
      }
      if (ctrlOrCmd && key === 'u') {
        e.preventDefault();
        report('DEV_TOOLS_ATTEMPT', 'Blocked shortcut: Ctrl+U (view source)');
        return;
      }

      // Keyboard refresh
      if (key === 'f5' || (ctrlOrCmd && key === 'r')) {
        e.preventDefault();
        report('REFRESH_ATTEMPT', `Blocked shortcut: ${key === 'f5' ? 'F5' : 'Ctrl+R'}`);
        return;
      }

      if (ctrlOrCmd && key === 'a') {
        e.preventDefault();
        report('KEY_SHORTCUT', 'Blocked shortcut: Ctrl+A (select all)');
      } else if (ctrlOrCmd && key === 'p') {
        e.preventDefault();
        report('KEY_SHORTCUT', 'Blocked shortcut: Ctrl+P (print)');
      } else if (ctrlOrCmd && key === 's') {
        e.preventDefault();
        report('KEY_SHORTCUT', 'Blocked shortcut: Ctrl+S (save)');
      }
    };

    // Best-effort logging for actions we can detect but can't fully prevent
    // in code — clicking the browser's own Refresh button, or closing the
    // tab. Uses fetch with keepalive so the request has a real chance to
    // reach the server even as the page unloads.
    const logBeacon = (eventType, description) => {
      try {
        const stored = localStorage.getItem('examAppUser');
        const token = stored ? JSON.parse(stored).token : null;
        const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        fetch(`${base}/logs/${examId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ eventType, description }),
          keepalive: true,
        }).catch(() => {});
      } catch (err) {
        // best-effort only — never block page unload over this
      }
    };

    // Shows the browser's native "leave this page?" dialog and logs the
    // attempt. This is what catches the toolbar Refresh button and tab
    // close/navigate-away — none of which fire a normal keydown event.
    const handleBeforeUnload = (e) => {
      logBeacon('REFRESH_ATTEMPT', 'Page refresh/close attempted via browser UI');
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    // Traps the browser Back button: immediately re-pushes the current URL
    // so navigation is cancelled, and logs the attempt.
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      report('REFRESH_ATTEMPT', 'Back button pressed');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [active, examId]);
};

export default useAntiCheat;