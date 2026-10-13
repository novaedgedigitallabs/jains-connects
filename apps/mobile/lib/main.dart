import 'package:flutter/material.dart';

import 'src/api/temple_api_client.dart';
import 'src/screens/home_shell.dart';
import 'src/theme/app_theme.dart';

void main() {
  const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001/api/v1',
  );

  runApp(
    JainConnectApp(
      apiClient: TempleApiClient.fromBaseUrl(Uri.parse(apiBaseUrl)),
    ),
  );
}

class JainConnectApp extends StatelessWidget {
  const JainConnectApp({super.key, required this.apiClient});

  final TempleApiClient apiClient;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JainConnect',
      theme: buildAppTheme(),
      home: HomeShell(apiClient: apiClient),
    );
  }
}
