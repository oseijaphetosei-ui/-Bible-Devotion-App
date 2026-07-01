import React from 'react';
import LegalDocScreen from './LegalDocScreen';
import { PRIVACY_POLICY, PRIVACY_POLICY_URL } from '../../constants/legal';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocScreen
      title="Privacy Policy"
      identLabel="LEGAL · PRIVACY"
      icon="shield-checkmark-outline"
      sections={PRIVACY_POLICY}
      publicUrl={PRIVACY_POLICY_URL || undefined}
    />
  );
}
