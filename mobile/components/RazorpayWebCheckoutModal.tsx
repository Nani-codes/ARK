import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { brand, colors, spacing, typography } from '@/lib/theme';
import { useRazorpayCheckoutStore } from '@/stores/razorpayCheckout';

function buildCheckoutHtml(params: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  contact?: string;
  email?: string;
}) {
  const contact = params.contact ?? '';
  const email = params.email ?? '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f9f9fc; }
    .wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .msg { color: #555; font-size: 16px; }
  </style>
</head>
<body>
  <div class="wrap"><p class="msg">Opening secure payment…</p></div>
  <script>
    function post(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    function start() {
      var options = {
        key: ${JSON.stringify(params.keyId)},
        amount: ${params.amount},
        currency: ${JSON.stringify(params.currency)},
        name: 'ARK',
        description: 'Order payment',
        order_id: ${JSON.stringify(params.orderId)},
        prefill: {
          contact: ${JSON.stringify(contact)},
          email: ${JSON.stringify(email)},
        },
        theme: { color: ${JSON.stringify(brand.navy)} },
        handler: function (response) {
          post({ type: 'success', data: response });
        },
        modal: {
          ondismiss: function () {
            post({ type: 'cancel' });
          },
        },
      };
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        post({
          type: 'error',
          message: (response.error && response.error.description) || 'Payment failed',
        });
      });
      rzp.open();
    }
    window.onload = start;
  </script>
</body>
</html>`;
}

export function RazorpayWebCheckoutModal() {
  const insets = useSafeAreaInsets();
  const session = useRazorpayCheckoutStore((s) => s.session);
  const completeWebCheckout = useRazorpayCheckoutStore((s) => s.completeWebCheckout);
  const cancelWebCheckout = useRazorpayCheckoutStore((s) => s.cancelWebCheckout);

  const html = useMemo(() => {
    if (!session) return '';
    return buildCheckoutHtml({
      keyId: session.keyId,
      orderId: session.orderId,
      amount: session.amount,
      currency: session.currency,
      contact: session.prefill?.contact,
      email: session.prefill?.email,
    });
  }, [session]);

  if (!session) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={() => cancelWebCheckout()}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Pay securely</Text>
          <Pressable onPress={() => cancelWebCheckout()} hitSlop={12} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          onMessage={(event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data) as {
                type: string;
                data?: {
                  razorpay_order_id: string;
                  razorpay_payment_id: string;
                  razorpay_signature: string;
                };
                message?: string;
              };

              if (payload.type === 'success' && payload.data) {
                completeWebCheckout(payload.data);
                return;
              }
              if (payload.type === 'cancel') {
                cancelWebCheckout();
                return;
              }
              if (payload.type === 'error') {
                cancelWebCheckout(payload.message ?? 'Payment failed');
              }
            } catch {
              cancelWebCheckout('Payment failed');
            }
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.unit3,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  title: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  closeBtn: { padding: spacing.unit1 },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
