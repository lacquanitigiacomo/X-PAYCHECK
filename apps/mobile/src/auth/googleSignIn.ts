import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

export type GoogleIdentity = {
  idToken: string;
  name: string;
  email: string;
  picture?: string;
};

const GOOGLE_CONFIGURATION_ERROR =
  'Google Sign-In non configurato: imposta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e crea una development build.';

export async function signInWithGoogle(): Promise<GoogleIdentity> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) throw new Error(GOOGLE_CONFIGURATION_ERROR);

  GoogleSignin.configure({ webClientId });
  const hasServices = await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });
  if (!hasServices) throw new Error('Google Play Services non disponibile su questo dispositivo');

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) throw new Error('Accesso Google annullato');

  const { idToken, user } = response.data;
  if (!idToken) throw new Error('Google non ha restituito un token ID valido');

  return {
    idToken,
    name: user.name ?? user.givenName ?? user.email.split('@')[0],
    email: user.email,
    ...(user.photo ? { picture: user.photo } : {}),
  };
}
