import React from 'react';
import LegalDocScreen from './LegalDocScreen';
import { TERMS_OF_SERVICE, TERMS_OF_SERVICE_URL } from '../../constants/legal';

export default function TermsOfServiceScreen() {
  return (
    <LegalDocScreen
      title="Terms of Service"
      identLabel="LEGAL · TERMS"
      icon="document-text-outline"
      sections={TERMS_OF_SERVICE}
      publicUrl={TERMS_OF_SERVICE_URL || undefined}
    />
  );
}
