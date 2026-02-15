import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { createAssistantSocket } from '../api/socket.js';

export default function BankAssistantChat({ token }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'היי, אני העוזר הבנקאי שלך. אפשר לשאול על יתרה, העברה אחרונה ומספר העברות.'
    }
  ]);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!token) return undefined;

    const socket = createAssistantSocket({ token });
    socketRef.current = socket;

    socket.on('connect_error', () => {
      setError('חיבור הצ׳אט נכשל. בדוק טוקן או הגדרות שרת.');
      setIsLoading(false);
    });

    socket.on('bot_reply', (payload) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: payload?.message || '' }
      ]);
      setIsLoading(false);
    });

    socket.on('chat_error', (payload) => {
      setError(payload?.message || 'שגיאה בצ׳אט.');
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading]);

  const disabled = useMemo(
    () => !socketRef.current || isLoading || !input.trim(),
    [isLoading, input]
  );

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !socketRef.current) return;

    setError('');
    setIsLoading(true);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    socketRef.current.emit('chat_message', { message: text });
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 1200
      }}
    >
      {!open ? (
        <Button
          variant="contained"
          startIcon={<ChatBubbleOutlineIcon />}
          onClick={() => setOpen(true)}
        >
          Bank Assistant
        </Button>
      ) : (
        <Paper sx={{ width: 360, height: 520, p: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>Bank Assistant</Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box
            ref={listRef}
            sx={{
              height: 390,
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: 1,
              p: 1
            }}
          >
            <Stack spacing={1}>
              {messages.map((message, index) => (
                <Box
                  key={`${message.role}-${index}`}
                  sx={{
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    bgcolor: message.role === 'user' ? '#dbeafe' : '#f1f5f9',
                    px: 1.2,
                    py: 0.8,
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                </Box>
              ))}
              {isLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={14} />
                  <Typography variant="caption">כותב תשובה...</Typography>
                </Stack>
              ) : null}
            </Stack>
          </Box>

          {error ? (
            <Typography color="error" variant="caption" sx={{ mt: 0.8, display: 'block' }}>
              {error}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="לדוגמה: מה היתרה שלי?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button variant="contained" onClick={sendMessage} disabled={disabled}>
              שלח
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
