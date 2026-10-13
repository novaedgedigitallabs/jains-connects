# JainConnect Android app

This Flutter application provides the first mobile discovery slice: a five-tab
navigation shell, approved temple search, temple detail pages, loading/empty/
error states, and a typed HTTP client for the shared `/api/v1/temples` API.

Sensitive account, donor, payment, and notification workflows are not stored
or exposed by this slice. They will use the shared backend authorization and
privacy controls before being added.

## Commands

```sh
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

The default Android emulator API base is
`http://10.0.2.2:3001/api/v1`. Override it with
`--dart-define=API_BASE_URL=...` when running against another environment.
