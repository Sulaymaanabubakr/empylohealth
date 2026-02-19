import React from 'react';
import { useScreenProtection } from '../security/useScreenProtection';

const ProtectedScreen = ({ enabled = true, reason = 'protected-screen', children }) => {
  useScreenProtection({ enabled, reason });
  return <>{children}</>;
};

export default ProtectedScreen;

