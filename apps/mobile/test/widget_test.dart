import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:jainconnect/main.dart';
import 'package:jainconnect/src/api/temple_api_client.dart';

class _FakeHttpClient extends http.BaseClient {
  _FakeHttpClient(this.body);

  final String body;
  Uri? requestedUri;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    requestedUri = request.url;
    return http.StreamedResponse(
      Stream<List<int>>.value(utf8.encode(body)),
      200,
      headers: {'content-type': 'application/json'},
    );
  }
}

void main() {
  testWidgets('home offers the temple discovery entry point', (tester) async {
    final client = TempleApiClient(
      baseUrl: Uri.parse('https://example.test/api/v1'),
      httpClient: _FakeHttpClient(_directoryJson),
    );
    addTearDown(client.close);

    await tester.pumpWidget(JainConnectApp(apiClient: client));

    expect(
      find.text('Useful Jain community information, in one place.'),
      findsOneWidget,
    );
    expect(find.text('Find a temple'), findsOneWidget);
  });

  testWidgets('discover loads approved temple cards from the API', (
    tester,
  ) async {
    final httpClient = _FakeHttpClient(_directoryJson);
    final client = TempleApiClient(
      baseUrl: Uri.parse('https://example.test/api/v1'),
      httpClient: httpClient,
    );
    addTearDown(client.close);

    await tester.pumpWidget(JainConnectApp(apiClient: client));
    await tester.tap(find.text('Discover'));
    await tester.pumpAndSettle();

    expect(find.text('Synthetic Published Temple'), findsOneWidget);
    expect(find.text('Indore, Madhya Pradesh'), findsOneWidget);
    expect(find.text('Verified record'), findsOneWidget);
    expect(httpClient.requestedUri?.path, '/api/v1/temples');
    expect(httpClient.requestedUri?.queryParameters['page'], '1');
  });
}

const _directoryJson = '''
{
  "data": [
    {
      "id": "7a2c7a82-769a-4d76-b9bf-8e27b9bc4242",
      "name": "Synthetic Published Temple",
      "slug": "synthetic-published-temple",
      "traditionOrLineage": null,
      "description": "Synthetic test record.",
      "history": null,
      "addressLine1": "1 Community Way",
      "addressLine2": null,
      "city": "Indore",
      "state": "Madhya Pradesh",
      "postalCode": null,
      "country": "India",
      "timezone": "Asia/Kolkata",
      "publicEmail": null,
      "publicPhone": null,
      "websiteUrl": null,
      "darshanInformation": null,
      "verificationStatus": "VERIFIED",
      "lastReviewedAt": "2026-10-13T00:00:00.000Z"
    }
  ],
  "pagination": {"page": 1, "pageSize": 20, "total": 1, "totalPages": 1}
}
''';
