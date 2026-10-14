import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/public_temple.dart';

class TempleApiException implements Exception {
  const TempleApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class TempleApiClient {
  TempleApiClient({required Uri baseUrl, http.Client? httpClient})
    : _baseUrl = ApiBaseUrl.fromUri(baseUrl),
      _httpClient = httpClient ?? http.Client();

  factory TempleApiClient.fromBaseUrl(Uri baseUrl) {
    return TempleApiClient(baseUrl: baseUrl);
  }

  final ApiBaseUrl _baseUrl;
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
    late final http.Response response;
    try {
      response = await _httpClient
          .get(_endpoint(path, parameters))
          .timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw const TempleApiException(
        'The temple directory took too long to respond. Please check your connection and try again.',
      );
    } on SocketException {
      throw const TempleApiException(
        'The temple directory could not be reached. Please check your connection and try again.',
      );
    } on http.ClientException {
      throw const TempleApiException(
        'The temple directory could not be reached. Please try again.',
      );
    }

    if (response.statusCode != 200) {
      throw const TempleApiException(
        'The temple directory is temporarily unavailable. Please try again.',
      );
    }

    late final Object? decoded;
    try {
      decoded = jsonDecode(response.body);
    } on FormatException {
      throw const TempleApiException(
        'The temple directory returned an invalid response.',
      );
    }
    if (decoded is! Map<String, dynamic>) {
      throw const TempleApiException(
        'The temple directory returned an invalid response.',
      );
    }
    return decoded;
  }

  Uri _endpoint(String path, Map<String, String> parameters) {
    final basePath = _baseUrl.uri.path.endsWith('/')
        ? _baseUrl.uri.path
        : '${_baseUrl.uri.path}/';
    final relativePath = path.startsWith('/') ? path.substring(1) : path;
    return _baseUrl.uri.replace(
      path: '$basePath$relativePath',
      queryParameters: parameters,
    );
  }

  void close() {
    _httpClient.close();
  }
}
