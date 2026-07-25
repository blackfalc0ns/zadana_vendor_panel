export const environment = {
  production: false,
  apiUrl: 'http://localhost:5298/api',
  realtimeEnabled: true,
  googleClientId: '931529488217-fkl3hinanqrgn9egbmb2mrnn4htv3bsh.apps.googleusercontent.com',
  oneSignal: {
    // Use the VendorWeb OneSignal app (same as production). Keep disabled on plain HTTP
    // unless testing localhost with allowLocalhostAsSecureOrigin + Notification permission.
    enabled: false,
    appId: 'a0a2059e-f011-464d-abe1-7b3de71f72ab',
    autoPrompt: true
  }
};
