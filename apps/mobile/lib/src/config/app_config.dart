enum AppEnvironment {
  development,
  staging,
  production;

  static AppEnvironment parse(String value) {
    switch (value.trim().toLowerCase()) {
      case 'development':
      case 'dev':
        return AppEnvironment.development;
      case 'staging':
      case 'stage':
        return AppEnvironment.staging;
      case 'production':
      case 'prod':
        return AppEnvironment.production;
      default:
        throw const AppConfigException(
          'APP_ENV must be development, staging, or production.',
        );
    }
  }
}

class AppConfigException implements Exception {
  const AppConfigException(this.message);

  final String message;

  @override
  String toString() => message;
}

class ApiBaseUrl {
  const ApiBaseUrl._(this.uri);

  static const emulatorDefault = 'http://10.0.2.2:3001/api/v1';

  final Uri uri;

  factory ApiBaseUrl.fromEnvironment({
    required String value,
    required AppEnvironment environment,
    required bool isRelease,
  }) {
    final requiresSecureTransport =
        isRelease || environment != AppEnvironment.development;
    final configuredValue = value.trim();
    final rawValue = configuredValue.isEmpty
        ? (requiresSecureTransport ? null : emulatorDefault)
        : configuredValue;

    if (rawValue == null) {
      throw const AppConfigException(
        'API_BASE_URL must be set to an HTTPS API URL for this build.',
      );
    }

    final parsed = _parseUri(rawValue);
    _validateUriShape(parsed);

    if (requiresSecureTransport && parsed.scheme != 'https') {
      throw const AppConfigException(
        'API_BASE_URL must use HTTPS outside development builds.',
      );
    }

    if (requiresSecureTransport && _isLocalHost(parsed.host)) {
      throw const AppConfigException(
        'API_BASE_URL must not point to a local or emulator host outside development builds.',
      );
    }

    return ApiBaseUrl._(parsed);
  }

  factory ApiBaseUrl.fromUri(Uri value) {
    _validateUriShape(value);
    return ApiBaseUrl._(value);
  }

  static Uri _parseUri(String value) {
    try {
      return Uri.parse(value);
    } on FormatException {
      throw const AppConfigException('API_BASE_URL is not a valid URL.');
    }
  }

  static void _validateUriShape(Uri value) {
    if (!value.isAbsolute || value.host.isEmpty) {
      throw const AppConfigException(
        'API_BASE_URL must be an absolute URL with a host.',
      );
    }

    if (value.scheme != 'http' && value.scheme != 'https') {
      throw const AppConfigException(
        'API_BASE_URL must use the HTTP or HTTPS scheme.',
      );
    }

    if (value.userInfo.isNotEmpty || value.authority.contains('@')) {
      throw const AppConfigException(
        'API_BASE_URL must not contain username or password information.',
      );
    }

    if (value.hasQuery || value.hasFragment) {
      throw const AppConfigException(
        'API_BASE_URL must not contain a query string or fragment.',
      );
    }

    if (value.path.contains('\\') ||
        value.pathSegments.any((segment) => segment == '.' || segment == '..')) {
      throw const AppConfigException('API_BASE_URL contains an invalid path.');
    }
  }

  static bool _isLocalHost(String host) {
    switch (host.toLowerCase()) {
      case 'localhost':
      case '127.0.0.1':
      case '0.0.0.0':
      case '::1':
      case '10.0.2.2':
      case '10.0.3.2':
        return true;
      default:
        return false;
    }
  }
}

class AppConfig {
  const AppConfig({required this.environment, required this.apiBaseUrl});

  factory AppConfig.fromEnvironment({
    required String apiBaseUrl,
    required String environment,
    required bool isRelease,
  }) {
    final parsedEnvironment = AppEnvironment.parse(environment);
    return AppConfig(
      environment: parsedEnvironment,
      apiBaseUrl: ApiBaseUrl.fromEnvironment(
        value: apiBaseUrl,
        environment: parsedEnvironment,
        isRelease: isRelease,
      ),
    );
  }

  final AppEnvironment environment;
  final ApiBaseUrl apiBaseUrl;
}
