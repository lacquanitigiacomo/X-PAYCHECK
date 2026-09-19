import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signInWithGoogle } from './googleSignIn';

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: vi.fn(),
    hasPlayServices: vi.fn(),
    signIn: vi.fn(),
  },
  isSuccessResponse: vi.fn(),
}));

const configure = vi.mocked(GoogleSignin.configure);
const hasPlayServices = vi.mocked(GoogleSignin.hasPlayServices);
const signIn = vi.mocked(GoogleSignin.signIn);
const successResponse = vi.mocked(isSuccessResponse);

const googleUser = {
  type: 'success' as const,
  data: {
    idToken: 'google-id-token',
    serverAuthCode: null,
    scopes: ['email', 'profile'],
    user: {
      id: 'google-user-id',
      name: 'Ada Rossi',
      email: 'ada@example.it',
      photo: 'https://example.test/ada.png',
      familyName: 'Rossi',
      givenName: 'Ada',
    },
  },
};

describe('Google Sign-In adapter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-client-id.apps.googleusercontent.com';
    hasPlayServices.mockResolvedValue(true);
  });

  it('returns the verified Google identity and token', async () => {
    signIn.mockResolvedValue(googleUser);
    successResponse.mockReturnValue(true);

    await expect(signInWithGoogle()).resolves.toEqual({
      idToken: 'google-id-token',
      name: 'Ada Rossi',
      email: 'ada@example.it',
      picture: 'https://example.test/ada.png',
    });
    expect(configure).toHaveBeenCalledWith({
      webClientId: 'web-client-id.apps.googleusercontent.com',
    });
    expect(hasPlayServices).toHaveBeenCalledWith({ showPlayServicesUpdateDialog: true });
  });

  it('reports missing native credentials before opening Google Sign-In', async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    await expect(signInWithGoogle()).rejects.toThrow(
      'Google Sign-In non configurato: imposta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e crea una development build.',
    );
    expect(signIn).not.toHaveBeenCalled();
  });

  it('rejects a cancelled Google response', async () => {
    signIn.mockResolvedValue({ type: 'cancelled', data: null });
    successResponse.mockReturnValue(false);

    await expect(signInWithGoogle()).rejects.toThrow('Accesso Google annullato');
  });

  it('rejects a successful response without an ID token', async () => {
    signIn.mockResolvedValue({
      ...googleUser,
      data: { ...googleUser.data, idToken: null },
    });
    successResponse.mockReturnValue(true);

    await expect(signInWithGoogle()).rejects.toThrow('Google non ha restituito un token ID valido');
  });
});
