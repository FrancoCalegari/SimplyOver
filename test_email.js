import { sendVerificationEmail } from './lib/email.js';
await sendVerificationEmail('test@example.com', 'testuser', 'fake-token-123');
