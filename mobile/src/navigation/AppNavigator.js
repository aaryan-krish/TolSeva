import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import VisitListScreen from '../screens/VisitListScreen';
import VerifyScreen from '../screens/VerifyScreen';
import CertificateScreen from '../screens/CertificateScreen';

const Stack = createNativeStackNavigator();

const NAV_THEME = {
  headerStyle: { backgroundColor: '#FF9933' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: 'bold' }
};

export default function AppNavigator() {
  const { auth } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={auth ? 'VisitList' : 'Login'}
        screenOptions={NAV_THEME}
      >
        {!auth ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'TolSeva — Inspector Login', headerLeft: () => null }}
          />
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
