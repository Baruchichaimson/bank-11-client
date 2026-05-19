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

export default function BankAssistantChat({ token, onAssistantAction, onTransferSuccess }) {
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
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferForm, setTransferForm] = useState({
    receiverEmail: '',
    amount: '',
    description: ''
  });
  const [transferFormError, setTransferFormError] = useState('');
  const [transferFormLanguage, setTransferFormLanguage] = useState('en');
  const [highAmountConfirmOpen, setHighAmountConfirmOpen] = useState(false);
  const [highAmountConfirmMessage, setHighAmountConfirmMessage] = useState('');
  const [highAmountConfirmLanguage, setHighAmountConfirmLanguage] = useState('en');
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const requestCounterRef = useRef(0);
  const activeRequestIdRef = useRef(null);
  const onAssistantActionRef = useRef(onAssistantAction);

  useEffect(() => {
    onAssistantActionRef.current = onAssistantAction;
  }, [onAssistantAction]);

  useEffect(() => {
    const socket = createAssistantSocket({ token });
    socketRef.current = socket;

    socket.on('connect_error', () => {
      setError('Chat connection failed. Please check your session and server configuration.');
      setIsLoading(false);
    });

    socket.on('bot_reply', (payload) => {
      const replyRequestId = String(payload?.requestId || '');
      if (activeRequestIdRef.current && replyRequestId && activeRequestIdRef.current !== replyRequestId) {
        return;
      }
      const messageText = String(payload?.message || '');
      if (messageText.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: messageText }
        ]);
      }
      const botText = messageText.toLowerCase();
      const transferSucceeded =
        botText.includes('transfer completed') ||
        botText.includes('ההעברה בוצעה בהצלחה') ||
        botText.includes('ההעברה הושלמה בהצלחה');
      if (transferSucceeded && typeof onTransferSuccess === 'function') {
        onTransferSuccess().catch(() => {});
        setTransferFormOpen(false);
        setHighAmountConfirmOpen(false);
        setTransferFormError('');
        setTransferForm({
          receiverEmail: '',
          amount: '',
          description: ''
        });
      }
      const actionType = typeof payload?.action === 'string' ? payload.action : payload?.action?.type;
      if (actionType === 'open_money_transfer_inline') {
        setTransferFormOpen(true);
        setHighAmountConfirmOpen(false);
        if (payload?.action?.language === 'he' || payload?.action?.language === 'en') {
          setTransferFormLanguage(payload.action.language);
        }
      }
      if (actionType === 'transfer_form_error') {
        setTransferFormOpen(true);
        setTransferSubmitting(false);
        if (payload?.action?.language === 'he' || payload?.action?.language === 'en') {
          setTransferFormLanguage(payload.action.language);
        }
        setTransferFormError(String(payload?.action?.message || ''));
      }
      if (actionType === 'transfer_high_amount_confirm') {
        setTransferFormOpen(false);
        setHighAmountConfirmOpen(true);
        setHighAmountConfirmMessage(String(payload?.action?.message || ''));
        if (payload?.action?.language === 'he' || payload?.action?.language === 'en') {
          setHighAmountConfirmLanguage(payload.action.language);
        }
      }
      if (payload?.action && typeof onAssistantActionRef.current === 'function') {
        onAssistantActionRef.current(actionType || payload.action);
      }
      activeRequestIdRef.current = null;
      setIsLoading(false);
      setTransferSubmitting(false);
    });

    socket.on('chat_error', (payload) => {
      const errorRequestId = String(payload?.requestId || '');
      if (activeRequestIdRef.current && errorRequestId && activeRequestIdRef.current !== errorRequestId) {
        return;
      }
      setError(payload?.message || 'Chat error.');
      activeRequestIdRef.current = null;
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
    requestCounterRef.current += 1;
    const requestId = String(requestCounterRef.current);
    activeRequestIdRef.current = requestId;
    socketRef.current.emit('chat_message', { requestId, message: text });
  };

  const cancelMessage = () => {
    const requestId = activeRequestIdRef.current;
    if (!requestId || !socketRef.current) return;
    socketRef.current.emit('cancel_chat_message', { requestId });
    activeRequestIdRef.current = null;
    setIsLoading(false);
  };

  const submitInlineTransfer = async () => {
    const receiverEmail = String(transferForm.receiverEmail || '').trim().toLowerCase();
    const amount = Number(transferForm.amount);
    const description = String(transferForm.description || '').trim();

    if (!receiverEmail || !receiverEmail.includes('@')) {
      setTransferFormError(
        transferFormLanguage === 'he'
          ? 'נא להזין אימייל תקין של נמען.'
          : 'Please enter a valid recipient email.'
      );
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setTransferFormError(
        transferFormLanguage === 'he'
          ? 'נא להזין סכום תקין גדול מ-0.'
          : 'Please enter a valid positive amount.'
      );
      return;
    }

    if (!socketRef.current) {
      setTransferFormError(
        transferFormLanguage === 'he'
          ? 'הצ׳אט אינו מחובר כרגע. נסה שוב.'
          : 'Chat is not connected right now. Please try again.'
      );
      return;
    }

    setTransferFormError('');
    setTransferSubmitting(true);

    const transferMessage = description
      ? `make transfer to ${receiverEmail} amount ${amount} description ${description}`
      : `make transfer to ${receiverEmail} amount ${amount}`;

    requestCounterRef.current += 1;
    const requestId = String(requestCounterRef.current);
    activeRequestIdRef.current = requestId;
    setIsLoading(true);
    socketRef.current.emit('chat_message', { requestId, message: transferMessage });
  };

  const submitHighAmountConfirmation = (approved) => {
    if (!socketRef.current) return;
    const text = approved
      ? (highAmountConfirmLanguage === 'he' ? 'כן' : 'yes')
      : (highAmountConfirmLanguage === 'he' ? 'לא' : 'no');

    setHighAmountConfirmOpen(false);
    setIsLoading(true);
    requestCounterRef.current += 1;
    const requestId = String(requestCounterRef.current);
    activeRequestIdRef.current = requestId;
    socketRef.current.emit('chat_message', { requestId, message: text });
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
            width: { xs: 'min(94vw, 360px)', md: 360 },
            height: { xs: 'min(78vh, 520px)', md: 520 },
            maxHeight: 'calc(100vh - 24px)',
            p: 1.5,
            bgcolor: chatPalette.paperBg,
            border: `1.5px solid ${chatPalette.border}`,
            display: 'flex',
            flexDirection: 'column',
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
              flex: 1,
              minHeight: 0,
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
                      whiteSpace: 'pre-line',
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

          {transferFormOpen ? (
            <Paper
              variant="outlined"
              sx={{
                mt: 1,
                p: 1,
                borderColor: chatPalette.actionBorder,
                bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.75)' : '#eff6ff'
              }}
            >
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Quick Transfer
                </Typography>
                <TextField
                  size="small"
                  label="Recipient email"
                  value={transferForm.receiverEmail}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, receiverEmail: e.target.value }))}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Amount (ILS)"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, amount: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01' }}
                />
                <TextField
                  size="small"
                  label="Description (optional)"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                {transferFormError ? (
                  <Typography color="error" variant="caption">
                    {transferFormError}
                  </Typography>
                ) : null}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setTransferFormOpen(false);
                      setTransferFormError('');
                      setTransferForm({
                        receiverEmail: '',
                        amount: '',
                        description: ''
                      });
                    }}
                    disabled={transferSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={submitInlineTransfer}
                    disabled={transferSubmitting}
                  >
                    {transferSubmitting ? 'Sending…' : 'Send transfer'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : null}

          {highAmountConfirmOpen ? (
            <Paper
              variant="outlined"
              sx={{
                mt: 1,
                p: 1,
                borderColor: chatPalette.actionBorder,
                bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.75)' : '#eff6ff'
              }}
            >
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {highAmountConfirmLanguage === 'he' ? 'אישור נוסף להעברה' : 'Additional transfer confirmation'}
                </Typography>
                <Typography variant="body2">
                  {highAmountConfirmMessage}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => submitHighAmountConfirmation(false)}
                    disabled={isLoading}
                  >
                    {highAmountConfirmLanguage === 'he' ? 'לא' : 'No'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => submitHighAmountConfirmation(true)}
                    disabled={isLoading}
                  >
                    {highAmountConfirmLanguage === 'he' ? 'כן' : 'Yes'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={1}
              maxRows={6}
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={isLoading ? cancelMessage : sendMessage}
              disabled={isLoading ? false : disabled}
              sx={{
                border: '1.5px solid',
                borderColor: chatPalette.actionBorder,
                bgcolor: isLoading ? '#dc2626' : '#2563eb',
                '&:hover': {
                  bgcolor: isLoading ? '#b91c1c' : '#1d4ed8'
                }
              }}
            >
              {isLoading ? 'Cancel' : 'Send'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
