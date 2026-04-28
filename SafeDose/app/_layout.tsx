  import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';                            
  import { Stack } from 'expo-router';
  import { StatusBar } from 'expo-status-bar';                                                                  
  import 'react-native-reanimated';                                                                             
   
  import { useColorScheme } from '@/hooks/use-color-scheme';                                                    
  import { AppProvider } from '@/context/AppContext';
                                                                                                                
  export default function RootLayout() {
    const colorScheme = useColorScheme();                                                                       
                  
    return (
      <AppProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>                                                                                               
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(patient)" options={{ headerShown: false }} />                                  
            <Stack.Screen name="(caregiver)" options={{ headerShown: false }} />                                
            <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
          </Stack>                                                                                              
          <StatusBar style="auto" />
        </ThemeProvider>                                                                                        
      </AppProvider>
    );
  }