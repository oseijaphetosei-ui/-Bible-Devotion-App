import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ChatStackParamList } from '../../types/navigation';
import DirectMessageScreen from './DirectMessageScreen';

// Group chat reuses the DM screen — the messaging logic is identical.
// The chatId identifies the group; group-specific admin features (add/remove
// members, promote admins) can be added here once needed.

export default function GroupChatScreen() {
  return <DirectMessageScreen />;
}
