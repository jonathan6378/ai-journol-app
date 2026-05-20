import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store';

export default function Index() {
  const { session } = useAuthStore();
  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/welcome" />;
}
