import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'src/api/temple_api_client.dart';
import 'src/config/app_config.dart';
import 'src/screens/home_shell.dart';
import 'src/theme/app_theme.dart';

void main() {
  const apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  const environment = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );

  TempleApiClient? apiClient;
  String? configurationError;
  try {
    final config = AppConfig.fromEnvironment(
      apiBaseUrl: apiBaseUrl,
      environment: environment,
      isRelease: kReleaseMode,
    );
    apiClient = TempleApiClient.fromBaseUrl(config.apiBaseUrl.uri);
  } on AppConfigException catch (error) {
    configurationError = error.message;
  }

  runApp(
    JainConnectApp(
      apiClient: apiClient,
      configurationError: configurationError,
    ),
  );
}

class JainConnectApp extends StatelessWidget {
  const JainConnectApp({
    super.key,
    this.apiClient,
    this.configurationError,
  }) : assert(apiClient != null || configurationError != null);

  final TempleApiClient? apiClient;
  final String? configurationError;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JainConnect',
      theme: buildAppTheme(),
      home: configurationError == null
          ? HomeShell(apiClient: apiClient!)
          : ConfigurationErrorPage(message: configurationError!),
    );
  }
}

class ConfigurationErrorPage extends StatelessWidget {
  const ConfigurationErrorPage({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('JainConnect')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.settings_outlined, size: 42),
              const SizedBox(height: 12),
              Text(
                'This build is not configured',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(message, textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}
