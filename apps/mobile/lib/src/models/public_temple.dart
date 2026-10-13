class PublicTemple {
  const PublicTemple({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.traditionOrLineage,
    required this.addressLine1,
    required this.addressLine2,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
    required this.timezone,
    required this.publicEmail,
    required this.publicPhone,
    required this.websiteUrl,
    required this.darshanInformation,
    required this.lastReviewedAt,
  });

  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? traditionOrLineage;
  final String? addressLine1;
  final String? addressLine2;
  final String? city;
  final String? state;
  final String? postalCode;
  final String? country;
  final String? timezone;
  final String? publicEmail;
  final String? publicPhone;
  final String? websiteUrl;
  final String? darshanInformation;
  final DateTime? lastReviewedAt;

  factory PublicTemple.fromJson(Map<String, dynamic> json) {
    final id = _requiredString(json, 'id');
    final name = _requiredString(json, 'name');
    final slug = _requiredString(json, 'slug');

    if (json['verificationStatus'] != 'VERIFIED') {
      throw const FormatException('Temple record is not verified');
    }

    return PublicTemple(
      id: id,
      name: name,
      slug: slug,
      description: _nullableString(json, 'description'),
      traditionOrLineage: _nullableString(json, 'traditionOrLineage'),
      addressLine1: _nullableString(json, 'addressLine1'),
      addressLine2: _nullableString(json, 'addressLine2'),
      city: _nullableString(json, 'city'),
      state: _nullableString(json, 'state'),
      postalCode: _nullableString(json, 'postalCode'),
      country: _nullableString(json, 'country'),
      timezone: _nullableString(json, 'timezone'),
      publicEmail: _nullableString(json, 'publicEmail'),
      publicPhone: _nullableString(json, 'publicPhone'),
      websiteUrl: _nullableString(json, 'websiteUrl'),
      darshanInformation: _nullableString(json, 'darshanInformation'),
      lastReviewedAt: _nullableDate(json, 'lastReviewedAt'),
    );
  }

  static String _requiredString(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is String && value.isNotEmpty) return value;
    throw FormatException('Temple field $key is invalid');
  }

  static String? _nullableString(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value == null) return null;
    if (value is String) return value;
    throw FormatException('Temple field $key is invalid');
  }

  static DateTime? _nullableDate(Map<String, dynamic> json, String key) {
    final value = _nullableString(json, key);
    return value == null ? null : DateTime.tryParse(value);
  }

  String get locationLabel {
    return [
      city,
      state,
    ].whereType<String>().where((part) => part.isNotEmpty).join(', ');
  }

  String get addressLabel {
    return [
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    ].whereType<String>().where((part) => part.isNotEmpty).join(', ');
  }
}

class TemplePage {
  const TemplePage({
    required this.temples,
    required this.page,
    required this.totalPages,
  });

  final List<PublicTemple> temples;
  final int page;
  final int totalPages;

  factory TemplePage.fromJson(Map<String, dynamic> json) {
    final rawTemples = json['data'];
    final pagination = json['pagination'];
    if (rawTemples is! List || pagination is! Map<String, dynamic>) {
      throw const FormatException('Temple directory response is invalid');
    }

    final rawPage = pagination['page'];
    final rawTotalPages = pagination['totalPages'];
    if (rawPage is! num || rawTotalPages is! num) {
      throw const FormatException('Temple pagination is invalid');
    }

    return TemplePage(
      temples: rawTemples
          .map((item) {
            if (item is! Map<String, dynamic>) {
              throw const FormatException('Temple item is invalid');
            }
            return PublicTemple.fromJson(item);
          })
          .toList(growable: false),
      page: rawPage.toInt(),
      totalPages: rawTotalPages.toInt(),
    );
  }
}
