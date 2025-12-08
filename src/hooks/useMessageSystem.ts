import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMessageSystemResult {
  messages: string[];
  currentMessageIndex: number;
  isNotesVisible: boolean;
  handleNotesClick: () => void;
}

export function useMessageSystem(): UseMessageSystemResult {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isNotesVisible, setIsNotesVisible] = useState(true);

  const notesIntervalRef = useRef<number | null>(null);
  const notesFadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    fetch('MESSAGES.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load messages.');
        }
        return response.text();
      })
      .then(text => {
        if (isCancelled) {
          return;
        }

        const lines = text.split('\n');
        const blocks: string[] = [];
        let current: string[] = [];

        for (const line of lines) {
          if (!line.trim()) {
            if (current.length > 0) {
              blocks.push(current.join(' '));
              current = [];
            }
          } else {
            current.push(line.trim());
          }
        }

        if (current.length > 0) {
          blocks.push(current.join(' '));
        }

        setMessages(blocks);

        if (blocks.length > 0) {
          const initialIndex = Math.floor(Math.random() * blocks.length);
          setCurrentMessageIndex(initialIndex);
        } else {
          setCurrentMessageIndex(0);
        }
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }
        setMessages([]);
        setCurrentMessageIndex(0);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const cycleMessages = useCallback(() => {
    const messagesLength = messages.length;

    if (messagesLength <= 1) {
      return;
    }

    setIsNotesVisible(false);

    if (notesFadeTimeoutRef.current !== null) {
      window.clearTimeout(notesFadeTimeoutRef.current);
    }

    notesFadeTimeoutRef.current = window.setTimeout(() => {
      setCurrentMessageIndex(prevIndex => {
        const length = messages.length;
        if (length <= 1) {
          return prevIndex;
        }

        let nextIndex = Math.floor(Math.random() * length);

        if (nextIndex === prevIndex && length > 1) {
          nextIndex = (prevIndex + 1) % length;
        }

        return nextIndex;
      });

      setIsNotesVisible(true);
    }, 800);
  }, [messages]);

  const handleNotesClick = useCallback(() => {
    if (notesIntervalRef.current !== null) {
      window.clearInterval(notesIntervalRef.current);
    }

    cycleMessages();

    notesIntervalRef.current = window.setInterval(() => {
      cycleMessages();
    }, 10000);
  }, [cycleMessages]);

  useEffect(() => {
    if (notesIntervalRef.current !== null) {
      window.clearInterval(notesIntervalRef.current);
      notesIntervalRef.current = null;
    }

    if (notesFadeTimeoutRef.current !== null) {
      window.clearTimeout(notesFadeTimeoutRef.current);
      notesFadeTimeoutRef.current = null;
    }

    if (messages.length <= 1) {
      return;
    }

    notesIntervalRef.current = window.setInterval(() => {
      cycleMessages();
    }, 10000);

    return () => {
      if (notesIntervalRef.current !== null) {
        window.clearInterval(notesIntervalRef.current);
        notesIntervalRef.current = null;
      }
      if (notesFadeTimeoutRef.current !== null) {
        window.clearTimeout(notesFadeTimeoutRef.current);
        notesFadeTimeoutRef.current = null;
      }
    };
  }, [messages, cycleMessages]);

  return {
    messages,
    currentMessageIndex,
    isNotesVisible,
    handleNotesClick,
  };
}
