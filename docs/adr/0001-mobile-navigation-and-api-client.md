# ADR 0001: Mobile navigation and public discovery API client

- **Status:** Accepted for the first mobile slice
- **Date:** 2026-10-13
- **Scope:** `apps/mobile`

## Context

The repository had no Flutter implementation or established state-management
choice. The first mobile capability depends on the public temple directory API
and does not yet need authenticated state, offline persistence, push
notifications, or sensitive local storage.

## Decision

Use Flutter's Material 3 widgets, a small `StatefulWidget` shell with
`NavigationBar`, and the platform `Navigator` for the initial public discovery
flow. Keep HTTP and JSON parsing in `TempleApiClient` and typed model classes;
widgets receive the client through the app constructor so tests can use a fake
HTTP client.

The API base URL is supplied through the non-secret `API_BASE_URL` Dart define.
The Android emulator default is `http://10.0.2.2:3001/api/v1`. The client does
not persist responses or credentials.

## Alternatives considered

- **Riverpod/Bloc:** useful when authenticated and multi-screen state becomes
  substantial, but adds dependency and lifecycle complexity before that need
  exists.
- **`go_router`:** appropriate for deep links and larger route trees; defer
  until public detail links and authenticated route guards are implemented.
- **Local caching:** not selected because the current slice contains only
  public records and the cache invalidation/privacy policy is not defined.

## Consequences

- The first slice has minimal dependencies and straightforward widget tests.
- Navigation and fetch state will need a deliberate refactor or extension when
  authentication, deep links, session expiry, and notifications are added.
- No mobile workflow is authorized by client UI alone; future protected
  actions must remain server-enforced.
