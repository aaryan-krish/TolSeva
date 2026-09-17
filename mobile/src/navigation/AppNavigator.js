import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import VendorHomeScreen from '../screens/VendorHomeScreen';
import VisitListScreen from '../screens/VisitListScreen';
import VerifyScreen from '../screens/VerifyScreen';
import CertificateScreen from '../screens/CertificateScreen';

const Stack = createNativeStackNavigator();

const NAV_THEME = {
  headerStyle: { backgroundColor: '#003087' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: 'bold' }
};

export default function AppNavigator() {
  const { auth, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#003087', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C8960C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={NAV_THEME}>
        {!auth ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'TolSeva Portal', headerShown: false }}
          />
        ) : auth.role === 'vendor' ? (
          <>
            <Stack.Screen
              name="VendorHome"
              component={VendorHomeScreen}
              options={{ title: 'TolSeva — Vendor Services', headerLeft: () => null }}
            />
            <Stack.Screen
              name="Certificate"
              component={CertificateScreen}
              options={{ title: 'Digital Certificate' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="VisitList"
              component={VisitListScreen}
              options={{ title: 'Assigned Visits', headerLeft: () => null }}
            />
            <Stack.Screen
              name="Verify"
              component={VerifyScreen}
              options={{ title: 'Field Verification' }}
            />
            <Stack.Screen
              name="Certificate"
              component={CertificateScreen}
              options={{ title: 'Digital Certificate' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
