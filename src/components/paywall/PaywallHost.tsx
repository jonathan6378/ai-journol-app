import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { usePremiumStore } from '@/store';
import { Paywall } from './Paywall';

/**
 * Globally-mounted paywall. Any code can call usePremiumStore.openPaywall()
 * and this host will animate it in. Used by gated features (voice, memory,
 * weekly recap) so they don't each need to manage their own modal.
 */
export const PaywallHost: React.FC = () => {
  const { paywallOpen, closePaywall } = usePremiumStore();
  return (
    <Modal
      visible={paywallOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closePaywall}
    >
      <View style={styles.flex}>
        <Paywall onClose={closePaywall} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
