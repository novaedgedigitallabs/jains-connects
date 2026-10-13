import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/public_temple.dart';

class TempleApiException implements Exception {
  const TempleApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class TempleApiClient {
  TempleApiClient({required Uri baseUrl, http.Client? httpClient})
    : _baseUrl = baseUrl,
      _httpClient = httpClient ?? http.Client();

  factory TempleApiClient.fromBaseUrl(Uri baseUrl) {
    return TempleApiClient(baseUrl: baseUrl);
  }

  final Uri _baseUrl;
  final http.Client _httpClient;

  Future<TemplePage> fetchTemples({
    String? query,
    String? city,
    int page = 1,
  }) async {
    final parameters = <String, String>{'page': '$page', 'pageSize': '20'};
    if (query != null && query.trim().isNotEmpty) {
      parameters['q'] = query.trim();
    }
    if (city != null && city.trim().isNotEmpty) {
      parameters['city'] = city.trim();
    }

    final response = await _get('/temples', parameters);
    return TemplePage.fromJson(response);
  }

  Future<Map<String, dynamic>> _get(
    String path,
    Map<String, String> parameters,
  ) async {
    final response = await _httpClient
        .get(_endpoint(path, parameters))
        .timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      throw const TempleApiException(
        'The temple directory is temporarily unavailable. Please try again.',
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const TempleApiException(
        'The temple directory returned an invalid response.',
      );
    }
    return decoded;
  }

  Uri _endpoint(String path, Map<String, String> parameters) {
    final basePath = _baseUrl.path.endsWith('/')
        ? _baseUrl.path
        : '${_baseUrl.path}/';
    final relativePath = path.startsWith('/') ? path.substring(1) : path;
    return _baseUrl.replace(
      path: '$basePath$relativePath',
      queryParameters: parameters,
    );
  }

  void close() {
    _httpClient.close();
  }
}
