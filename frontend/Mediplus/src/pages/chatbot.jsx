import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Collapse,
  Tooltip,
  Fade,
  Divider,
  Avatar,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import { styled } from '@mui/system';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const theme = useTheme();
  const token = localStorage.getItem('token');

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { 
      sender: 'user', 
      message: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      const responseText = data.response || data.detail || '⚠️ Something went wrong.';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          message: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } catch (err) {
        console.error('Error:', err);
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        message: '❌ Server error. Please try again later.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggested = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/chatbot/suggest_questions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
  
      if (res.ok) {
        let formattedQuestions = '';
  
        if (Array.isArray(data.questions)) {
          formattedQuestions = data.questions
            .map((q, i) => `${i + 1}. ${q.trim()}`)
            .join('\n\n');
        } else if (typeof data.questions === 'string') {
          formattedQuestions = data.questions.replace(/\\n/g, '\n');
        }
  
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            message: `### 🧠 Suggested Questions\n\n${formattedQuestions}\n\nClick any question to ask it!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSuggestion: true
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { 
          sender: 'bot', 
          message: data.detail || '⚠️ Could not get suggestions.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        message: '❌ Failed to fetch suggestions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const toggleCollapse = (idx) => {
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Removed unused handleSuggestionClick function to resolve the error.

  const MessageBubble = styled(Paper)(({ theme, sender }) => ({
    padding: theme.spacing(1.5, 2),
    maxWidth: '85%',
    wordBreak: 'break-word',
    backgroundColor: sender === 'user' 
      ? theme.palette.primary.light 
      : theme.palette.grey[100],
    color: sender === 'user' 
      ? theme.palette.getContrastText(theme.palette.primary.light)
      : theme.palette.text.primary,
    borderRadius: sender === 'user' 
      ? '18px 18px 0 18px' 
      : '18px 18px 18px 0',
    boxShadow: theme.shadows[1],
    position: 'relative',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    '&:hover': {
      boxShadow: theme.shadows[2],
    }
  }));

  const MarkdownWrapper = ({ children }) => (
    <Box sx={{ 
      '& p': { margin: '0.5em 0' },
      '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
      '& pre': { 
        backgroundColor: theme.palette.grey[900],
        color: theme.palette.grey[50],
        padding: '1em',
        borderRadius: '4px',
        overflowX: 'auto',
        margin: '1em 0'
      },
      '& code': {
        fontFamily: 'monospace',
        backgroundColor: theme.palette.grey[200],
        padding: '0.2em 0.4em',
        borderRadius: '3px',
        fontSize: '0.9em'
      },
      '& blockquote': {
        borderLeft: `4px solid ${theme.palette.grey[300]}`,
        paddingLeft: '1em',
        margin: '1em 0',
        color: theme.palette.grey[600]
      },
      '& a': {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline'
        }
      }
    }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ 
      maxWidth: '800px', 
      mx: 'auto', 
      p: 2, 
      fontFamily: 'Poppins, sans-serif',
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        gap: 1
      }}>
        <SmartToyIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight={600} color="primary">
          MediPlus AI Assistant
        </Typography>
        <Tooltip title="Ask about your medications, side effects, or general health questions">
          <HelpOutlineIcon color="acton" fontSize="small" />
        </Tooltip>
      </Box>

      <Paper elevation={3} sx={{ 
        flex: 1,
        p: 2,
        overflowY: 'auto',
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.grey[50],
        borderRadius: '12px'
      }}>
        {messages.length === 0 ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            color: theme.palette.grey[500],
            p: 4
          }}>
            <SmartToyIcon sx={{ fontSize: 60, mb: 2 }} color="disabled" />
            <Typography variant="h6" gutterBottom>
              How can I help you today?
            </Typography>
            <Typography variant="body1">
              Ask about your medications, side effects, or general health questions.
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 3 }}
              onClick={handleSuggested}
              disabled={suggestionsLoading}
              startIcon={suggestionsLoading ? <CircularProgress size={20} /> : null}
            >
              Get personalized suggestions
            </Button>
          </Box>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <Fade in key={idx}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    my: 1,
                    alignItems: 'flex-start',
                  }}
                >
                  {msg.sender === 'bot' && (
                    <Avatar sx={{ 
                      bgcolor: theme.palette.grey[300],
                      width: 32, 
                      height: 32,
                      mr: 1,
                      mt: 0.5
                    }}>
                      <SmartToyIcon fontSize="small" />
                    </Avatar>
                  )}
                  
                  <Box sx={{ maxWidth: 'calc(100% - 48px)' }}>
                    <MessageBubble 
                      sender={msg.sender}
                      onClick={() => msg.isSuggestion ? null : toggleCollapse(idx)}
                    >
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1
                      }}>
                        {msg.sender === 'user' && (
                          <Avatar sx={{ 
                            bgcolor: theme.palette.primary.dark,
                            width: 24, 
                            height: 24,
                            mr: -0.5,
                            ml: -1
                          }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                        )}
                        
                        <Box sx={{ flex: 1 }}>
                          {msg.sender === 'bot' ? (
                            <>
                              <Collapse in={!collapsed[idx]} collapsedSize="1.5em">
                                <ReactMarkdown
                                  rehypePlugins={[rehypeRaw]}
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code({inline, className, children, ...props}) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return !inline && match ? (
                                        <SyntaxHighlighter
                                          language={match[1]}
                                          PreTag="div"
                                          {...props}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      ) : (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      );
                                    }
                                  }}
                                >
                                  {msg.message}
                                </ReactMarkdown>
                              </Collapse>
                              {msg.sender === 'bot' && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'flex-end',
                                  mt: 0.5
                                }}>
                                  <IconButton size="small" onClick={() => toggleCollapse(idx)}>
                                    {collapsed[idx] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                  </IconButton>
                                </Box>
                              )}
                            </>
                          ) : (
                            <Typography variant="body2">
                              {msg.message}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </MessageBubble>
                    <Typography variant="caption" sx={{ 
                      display: 'block',
                      textAlign: msg.sender === 'user' ? 'right' : 'left',
                      color: theme.palette.text.secondary,
                      mt: 0.5,
                      px: 1
                    }}>
                      {msg.timestamp}
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            ))}
            {loading && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                my: 2,
                gap: 1
              }}>
                <CircularProgress size={24} />
                <Typography variant="caption" color="text.secondary">
                  MediPlus AI is thinking...
                </Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        alignItems: 'flex-end'
      }}>
        <TextField
          variant="outlined"
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder="Ask anything about your medications..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              backgroundColor: theme.palette.background.paper,
            }
          }}
        />
        <Tooltip title="Send message">
          <span>
            <IconButton 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
              color="primary"
              sx={{ 
                height: '48px',
                width: '48px',
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                },
                '&:disabled': {
                  backgroundColor: theme.palette.grey[300]
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Button
        variant="contained"
        fullWidth
        sx={{ 
          mt: 1.5,
          py: 1.5,
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem'
        }}
        onClick={handleSuggested}
        disabled={suggestionsLoading}
        startIcon={suggestionsLoading ? <CircularProgress size={20} /> : null}
      >
        Get Personalized Medication Suggestions
      </Button>
    </Box>
  );
};

export default ChatBot;