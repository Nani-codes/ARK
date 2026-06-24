import { Redirect } from 'expo-router';

export default function ProfessionalsIndexRedirect() {
  return <Redirect href={'/(tabs)/professionals' as never} />;
}
