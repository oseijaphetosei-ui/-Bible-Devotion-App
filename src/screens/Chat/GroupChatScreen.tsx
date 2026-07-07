import React from 'react';
import DirectMessageScreen from './DirectMessageScreen';

// Group chat reuses the DM screen — the messaging logic is identical.
// DirectMessageScreen reads route.params?.groupName when otherName is absent.
// Group-specific admin features (add/remove members, promote admins)
// can be added here once needed.

export default function GroupChatScreen() {
  return <DirectMessageScreen />;
}
