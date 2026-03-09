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
import { alpha, useTheme } from '@mui/material/styles';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { createAssistantSocket } from '../api/socket.js';

export default function BankAssistantChat({ token }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi, I am your banking assistant. You can ask about your balance, your latest transfer, and transfer counts.'
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
      setError('Chat connection failed. Please check your token and server configuration.');
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
      setError(payload?.message || 'Chat error.');
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
  const chatPalette = useMemo(
    () =>
      isDarkMode
        ? {
            paperBg: '#111827',
            border: 'rgba(56, 189, 248, 0.55)',
            messagesBg: 'rgba(15, 23, 42, 0.45)',
            userBubbleBg: '#1d4ed8',
            assistantBubbleBg: '#0f172a',
            bubbleText: '#f8fafc',
            inputText: '#e2e8f0',
            placeholder: '#94a3b8',
            actionBorder: 'rgba(56, 189, 248, 0.65)'
          }
        : {
            paperBg: '#dbeafe',
            border: 'rgba(37, 99, 235, 0.35)',
            messagesBg: '#f8fafc',
            userBubbleBg: '#2563eb',
            assistantBubbleBg: '#ffffff',
            bubbleText: '#0f172a',
            inputText: '#0f172a',
            placeholder: '#64748b',
            actionBorder: 'rgba(37, 99, 235, 0.55)'
          },
    [isDarkMode]
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
        <Paper
          sx={{
            width: 360,
            height: 520,
            p: 1.5,
            bgcolor: chatPalette.paperBg,
            border: `1.5px solid ${chatPalette.border}`,
            boxShadow: isDarkMode
              ? '0 10px 28px rgba(2, 6, 23, 0.35)'
              : '0 10px 28px rgba(15, 23, 42, 0.12)'
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              mb: 1,
              mx: -1.5,
              mt: -1.5,
              px: 1.5,
              py: 1,
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
              background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)'
            }}
          >
            <Typography sx={{ fontWeight: 700, color: '#f8fafc' }}>Bank Assistant</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#f8fafc' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box
            ref={listRef}
            sx={{
              height: 390,
              overflowY: 'auto',
              border: `1px solid ${chatPalette.border}`,
              bgcolor: chatPalette.messagesBg,
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
                    bgcolor:
                      message.role === 'user'
                        ? chatPalette.userBubbleBg
                        : chatPalette.assistantBubbleBg,
                    border:
                      message.role === 'assistant' && !isDarkMode
                        ? `1px solid ${alpha('#0f172a', 0.1)}`
                        : 'none',
                    px: 1.2,
                    py: 0.8,
                    borderRadius: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        message.role === 'user' && !isDarkMode
                          ? '#f8fafc'
                          : chatPalette.bubbleText,
                      wordBreak: 'break-word'
                    }}
                  >
                    {message.text}
                  </Typography>
                </Box>
              ))}
              {isLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={14} />
                  <Typography variant="caption">Writing a reply...</Typography>
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
              placeholder="For example: What is my balance?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: isDarkMode ? alpha('#0f172a', 0.45) : '#ffffff',
                  borderRadius: 1.8,
                  '& fieldset': {
                    borderColor: chatPalette.actionBorder,
                    borderWidth: 1.5
                  },
                  '&:hover fieldset': {
                    borderColor: '#2563eb'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0ea5e9'
                  }
                },
                '& .MuiInputBase-input': { color: chatPalette.inputText },
                '& .MuiInputBase-input::placeholder': {
                  color: chatPalette.placeholder,
                  opacity: 1
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              disabled={disabled}
              sx={{
                border: '1.5px solid',
                borderColor: chatPalette.actionBorder,
                bgcolor: '#2563eb',
                '&:hover': {
                  bgcolor: '#1d4ed8'
                }
              }}
            >
              Send
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
