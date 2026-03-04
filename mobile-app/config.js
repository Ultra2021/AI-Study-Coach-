// Configuration file for the AI Study Coach mobile app
// Update the BASE_URL with your computer's IP address

// To find your IP address:
// Windows: Run 'ipconfig' in Command Prompt or PowerShell
// Mac/Linux: Run 'ifconfig' or 'ip addr' in Terminal

// Look for your local network IP (usually starts with 192.168.x.x or 10.0.x.x)
// Make sure your mobile device and computer are on the same WiFi network

export const API_CONFIG = {
  // CHANGE THIS to your computer's IP address
  BASE_URL: 'http://192.168.1.71:5000',
  
  // API endpoints
  ENDPOINTS: {
    LOGIN: '/api/mobile/login',
    STATS: '/api/mobile/stats',
    STUDY_GROUPS: '/api/mobile/study-groups',
    SESSIONS: '/sessions',
    LOG_SESSION: '/log',
    RECOMMENDATIONS: '/api/study-recommendations',
    PREDICTIONS: '/api/study-predictions',
    // AI endpoints
    AI_CHAT: '/api/ai/chat',
    AI_CHAT_HISTORY: '/api/ai/chat/history',
    AI_STUDY_PLAN: '/api/ai/study-plan',
    REMINDERS: '/api/ai/reminders',
    REMINDERS_DUE: '/api/ai/reminders/due',
    ALARMS: '/api/ai/alarms',
    ALARMS_DUE: '/api/ai/alarms/due',
    MONITORING_METRICS: '/api/ai/monitoring/metrics',
  },
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 10000,
};

// User data (for demo purposes)
export const USER_DATA = {
  name: 'Carolina',
  email: 'carolina@example.com',
};

// App theme colors
export const COLORS = {
  primary: '#667EEA',
  secondary: '#764BA2',
  accent: '#EF4444',
  background: '#E3F2FD',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#F5F5F5',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
};

export default API_CONFIG;
