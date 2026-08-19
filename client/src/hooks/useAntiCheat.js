import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 1000; // Prevents duplicate violation logs

// Handles browser-based anti-cheating features during the exam
const useAntiCheat = (active, examId, onViolation) => {
  const callbackRef = useRef(onViolation);
  callbackRef.current = onViolation;

  const lastLoggedRef = useRef({});
  const wasVisibleRef = useRef(true);
  const wasFullscreenRef = useRef(true);

  useEffect(() => {
    if (!active) return undefined;

    // Reset monitoring values
    wasVisibleRef.current = !document.hidden;
    wasFullscreenRef.current = !!document.fullscreenElement;

    const report = (eventType, description) => {
      const now = Date.now();
      if (now - (lastLoggedRef.current[eventType] || 0) < DEBOUNCE_MS) return;
      lastLoggedRef.current[eventType] = now;
      callbackRef.current(eventType, description);
    };

    // Detect tab switching
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      if (hidden && wasVisibleRef.current) {
        report('TAB_SWITCH', 'Tab switched or window minimized');
      }
      wasVisibleRef.current = !hidden;
    };

    // Detect browser focus loss
    const handleBlur = () => {
      if (!document.hidden) {
        report('TAB_SWITCH', 'Browser window lost focus');
      }
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      if (!isFs && wasFullscreenRef.current) {
        report('FULLSCREEN_EXIT', 'Exited fullscreen mode');
      }
      wasFullscreenRef.current = isFs;
    };

    // Block right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      report('RIGHT_CLICK', 'Right-click attempted');
    };

    // Block copy attempt
    const handleCopy = (e) => {
      e.preventDefault();
      report('COPY_ATTEMPT', 'Copy attempted');
    };

    // Block paste attempt
    const handlePaste = (e) => {
      e.preventDefault();
      report('PASTE_ATTEMPT', 'Paste attempted');
    };

    // Block cut attempt
    const handleCut = (e) => {
      e.preventDefault();
      report('CUT_ATTEMPT', 'Cut attempted');
    };

    // Detect keyboard shortcuts
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // Copy, paste and cut are handled by browser events

      // Block developer tool shortcuts
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

      // Block keyboard refresh
      if (key === 'f5' || (ctrlOrCmd && key === 'r')) {
        e.preventDefault();
        report('REFRESH_ATTEMPT', `Blocked shortcut: ${key === 'f5' ? 'F5' : 'Ctrl+R'}`);
        return;
      }

      // Block other keyboard shortcuts
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

    // Log refresh or page close attempts
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
        // Ignore errors while leaving the page
      }
    };

    // Warn before leaving or refreshing the exam page
    const handleBeforeUnload = (e) => {
      logBeacon('REFRESH_ATTEMPT', 'Page refresh/close attempted via browser UI');
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    // Prevent browser back button
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      report('REFRESH_ATTEMPT', 'Back button pressed');
    };

    // Add event listeners
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

    // Remove event listeners
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