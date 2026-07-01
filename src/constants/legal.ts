export const APP_NAME       = 'Daily Devotion';
export const CONTACT_EMAIL  = 'support@dailydevotion.app';
export const LAST_UPDATED   = 'July 1, 2026';
export const EFFECTIVE_DATE = 'July 1, 2026';

// ─── Public URLs ──────────────────────────────────────────────────────────────
// Paste your published Notion page URLs (or website URLs) here.
// These are required for App Store Connect and Google Play Console submissions.
// Example: 'https://your-workspace.notion.site/privacy-abc123'
export const PRIVACY_POLICY_URL   = 'https://equal-crepe-485.notion.site/Privacy-Policy-390a8b3ab03280aa8bfee70d940b96fa';
export const TERMS_OF_SERVICE_URL = 'https://equal-crepe-485.notion.site/Terms-of-Service-390a8b3ab032806d8721d0d9207114b4';

// ─── Privacy Policy content ───────────────────────────────────────────────────

export type LegalSection = {
  heading: string;
  body: string[];
};

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: 'Introduction',
    body: [
      `Daily Devotion ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use the Daily Devotion app ("App").`,
      `By using the App, you agree to the practices described in this policy. If you do not agree, please discontinue use.`,
    ],
  },
  {
    heading: 'Information We Collect',
    body: [
      `Account Information: When you create a profile, we collect your display name, profile picture, and optional bio. This information is stored securely in Firebase and tied to your account.`,
      `Usage Data: We collect information about how you interact with the App — including chapters read, reading streaks, features used, and general engagement patterns. This is used solely to personalize your experience and improve the App.`,
      `Device Information: We may collect your device type, operating system version, and unique device identifiers to ensure compatibility and diagnose issues.`,
      `Push Notification Tokens: If you enable push notifications, we store your device notification token to deliver your scheduled reminders. You may disable notifications at any time in Settings.`,
    ],
  },
  {
    heading: 'Your Notes and Prayer Journal',
    body: [
      `We take the privacy of your spiritual content seriously. Your Notes, Prayer Journal entries, and personal reflections are stored in Firebase under your unique account identifier.`,
      `We do not read, sell, or share your personal notes or prayers with third parties. This content is private and is never used to train AI models or for advertising purposes.`,
      `If you delete your account, your notes and journal entries are permanently deleted from our servers within 30 days.`,
    ],
  },
  {
    heading: 'AI-Powered Features',
    body: [
      `Daily Devotion includes AI-powered features such as Scripture Chat and Scripture Insights, powered by third-party AI services (including Anthropic\'s Claude).`,
      `When you use these features, your Scripture queries and conversation context are sent to the AI provider to generate responses. These queries are not stored by us beyond the current session.`,
      `AI-generated responses are for devotional and educational purposes only and should not be treated as theological authority. Please consult a pastor or spiritual leader for guidance on matters of faith.`,
      `We do not use your AI chat history to train models or share it with third parties beyond what is required to process your request.`,
    ],
  },
  {
    heading: 'Community Features',
    body: [
      `The App includes community features such as shared posts and group discussions. Content you post publicly is visible to other users of the App.`,
      `Direct messages are stored in Firebase and are visible only to the participants of the conversation.`,
      `We reserve the right to remove content that violates our Community Guidelines.`,
    ],
  },
  {
    heading: 'Push Notifications',
    body: [
      `We use push notifications to deliver your daily reminders, verse of the day, and reading plan updates. These are sent through Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs).`,
      `You can manage or disable notifications at any time through the App\'s Notification Settings or your device\'s system settings.`,
    ],
  },
  {
    heading: 'Third-Party Services',
    body: [
      `Daily Devotion uses the following third-party services, each with their own privacy policies:`,
      `• Firebase (Google) — Authentication, database, and cloud functions. Learn more at firebase.google.com/support/privacy.`,
      `• Anthropic — AI-powered Scripture features. Learn more at anthropic.com/privacy.`,
      `• Apple / Google — Push notification delivery and payment processing.`,
      `We do not sell your data to advertisers or data brokers.`,
    ],
  },
  {
    heading: 'Data Retention',
    body: [
      `We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it by law.`,
      `Anonymous usage analytics may be retained in aggregated, non-identifiable form for product improvement.`,
    ],
  },
  {
    heading: "Children's Privacy",
    body: [
      `Daily Devotion is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13.`,
      `If you believe we have inadvertently collected information from a child under 13, please contact us immediately and we will delete that information promptly.`,
    ],
  },
  {
    heading: 'Your Rights',
    body: [
      `Depending on your location, you may have the right to access, correct, or delete your personal data, or to object to certain processing activities.`,
      `To exercise these rights, contact us at the email address below. We will respond to all requests within 30 days.`,
      `You may delete your account and all associated data directly within the App under Profile → Settings.`,
    ],
  },
  {
    heading: 'Security',
    body: [
      `We implement industry-standard security measures including data encryption in transit (TLS) and at rest, Firebase security rules, and regular security reviews.`,
      `While we take reasonable precautions, no system is perfectly secure. We encourage you to use a strong, unique password and to notify us immediately of any suspected unauthorized access.`,
    ],
  },
  {
    heading: 'Changes to This Policy',
    body: [
      `We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top of this page and, for material changes, notify you via push notification or in-app message.`,
      `Your continued use of the App after changes are posted constitutes your acceptance of the updated policy.`,
    ],
  },
  {
    heading: 'Contact Us',
    body: [
      `If you have questions about this Privacy Policy or your personal data, please contact us:`,
      `Email: support@dailydevotion.app`,
      `We aim to respond to all privacy inquiries within 5 business days.`,
    ],
  },
];

// ─── Terms of Service content ─────────────────────────────────────────────────

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    heading: 'Acceptance of Terms',
    body: [
      `By downloading, installing, or using Daily Devotion ("App," "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.`,
      `We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance. Material changes will be communicated via in-app notification.`,
    ],
  },
  {
    heading: 'Eligibility',
    body: [
      `You must be at least 13 years of age to use Daily Devotion. By using the App, you confirm that you meet this requirement.`,
      `If you are between 13 and 18, you confirm that a parent or guardian has reviewed and agreed to these Terms on your behalf.`,
    ],
  },
  {
    heading: 'User Accounts',
    body: [
      `To access certain features, you may create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.`,
      `You agree to provide accurate, current, and complete information when creating your account and to update it as necessary.`,
      `You may delete your account at any time through Profile Settings. Account deletion is permanent and irreversible.`,
    ],
  },
  {
    heading: 'Acceptable Use',
    body: [
      `You agree to use Daily Devotion only for lawful purposes and in accordance with these Terms. You agree not to:`,
      `• Post, share, or transmit content that is harmful, offensive, abusive, defamatory, or otherwise objectionable.`,
      `• Harass, threaten, or intimidate other users.`,
      `• Attempt to gain unauthorized access to any part of the App or its infrastructure.`,
      `• Use the App to distribute spam, malware, or unsolicited commercial messages.`,
      `• Impersonate any person or entity, or misrepresent your affiliation with any person or entity.`,
      `• Violate any applicable local, national, or international law or regulation.`,
    ],
  },
  {
    heading: 'AI Features Disclaimer',
    body: [
      `Daily Devotion includes AI-powered features including Scripture Chat and Scripture Insights. These features are provided for devotional, educational, and inspirational purposes only.`,
      `AI-generated content does not constitute theological advice, pastoral counsel, or doctrinal authority. The App and its developers do not guarantee the accuracy, completeness, or fitness of AI-generated content for any particular purpose.`,
      `You should not rely on AI responses as a substitute for guidance from a qualified pastor, theologian, or spiritual counselor.`,
      `By using AI features, you acknowledge and accept these limitations.`,
    ],
  },
  {
    heading: 'User-Generated Content',
    body: [
      `You retain ownership of content you create within the App, including notes, prayer journal entries, and community posts ("User Content").`,
      `By submitting User Content to public areas of the App, you grant Daily Devotion a non-exclusive, royalty-free, worldwide license to display that content within the App for the purpose of operating the Service.`,
      `Private content (notes, prayers) is not shared and is not subject to the above license.`,
      `You represent that you have all necessary rights to the User Content you submit and that it does not violate any third-party rights.`,
    ],
  },
  {
    heading: 'Community Guidelines',
    body: [
      `Daily Devotion is a faith-based community. We expect all users to engage with respect, grace, and love.`,
      `Content that promotes hatred, discrimination, violence, or harm toward any individual or group is strictly prohibited.`,
      `Content that is sexually explicit, blasphemous, or directly contradicts the core tenets of the Christian faith may be removed at our discretion.`,
      `We reserve the right to remove any content and suspend or terminate any account that violates these guidelines, without notice.`,
    ],
  },
  {
    heading: 'Intellectual Property',
    body: [
      `The App, its original content (excluding User Content), features, and functionality are owned by Daily Devotion and are protected by copyright, trademark, and other intellectual property laws.`,
      `Bible translations displayed in the App are used under their respective licenses. The King James Version (KJV) is in the public domain. Asante Twi and Akuapem Twi translations are used with appropriate permissions.`,
      `You may not reproduce, distribute, modify, or create derivative works of the App or its content without express written permission.`,
    ],
  },
  {
    heading: 'Subscriptions and Payments',
    body: [
      `Daily Devotion may offer premium features through paid subscriptions in the future. Any subscription terms, pricing, and billing details will be clearly disclosed at the time of purchase.`,
      `All purchases are processed through the Apple App Store or Google Play Store, subject to their respective terms and refund policies.`,
      `We reserve the right to change pricing at any time with reasonable notice. Price changes will not affect existing active subscription periods.`,
    ],
  },
  {
    heading: 'Disclaimer of Warranties',
    body: [
      `Daily Devotion is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.`,
      `We do not warrant that the App will be uninterrupted, error-free, or free of viruses or other harmful components.`,
      `We do not warrant the accuracy, reliability, or completeness of any content within the App, including AI-generated responses.`,
    ],
  },
  {
    heading: 'Limitation of Liability',
    body: [
      `To the maximum extent permitted by applicable law, Daily Devotion and its developers, officers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the App.`,
      `Our total liability for any claim related to the App shall not exceed the amount you paid to us in the 12 months preceding the claim, or $10 USD if you have not made any payments.`,
    ],
  },
  {
    heading: 'Account Termination',
    body: [
      `We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, the App, or third parties.`,
      `You may terminate your account at any time by deleting it within the App. Termination does not entitle you to a refund of any paid subscription fees.`,
    ],
  },
  {
    heading: 'Governing Law',
    body: [
      `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Daily Devotion is headquartered, without regard to conflict of law provisions.`,
      `Any disputes arising under these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be subject to binding arbitration.`,
    ],
  },
  {
    heading: 'Changes to Terms',
    body: [
      `We reserve the right to update these Terms at any time. We will notify you of significant changes via in-app notification or email.`,
      `Your continued use of the App after changes take effect constitutes your agreement to the revised Terms.`,
    ],
  },
  {
    heading: 'Contact Us',
    body: [
      `If you have any questions about these Terms of Service, please contact us:`,
      `Email: support@dailydevotion.app`,
      `We aim to respond to all inquiries within 5 business days.`,
    ],
  },
];
