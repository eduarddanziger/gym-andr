// App.tsx — temporary smoke test, replace in Phase 5
import { View, Text } from 'react-native';
import { serviceLocator } from '@src/ServiceLocator';

export default function App() {
  // If ServiceLocator instantiates without throwing, all imports resolved correctly
  console.log('ServiceLocator ready:', Object.keys(serviceLocator));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>gym-andr — DDD scaffold OK</Text>
    </View>
  );
}
