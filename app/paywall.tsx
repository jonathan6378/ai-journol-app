import React from 'react';
import { useRouter } from 'expo-router';
import { Paywall } from '@/components/paywall/Paywall';

export default function PaywallRoute() {
  const router = useRouter();
  return <Paywall onClose={() => router.back()} />;
}
