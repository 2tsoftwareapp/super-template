class AppNotification {
  AppNotification.fromJson(Map<String, dynamic> json)
      : id = json['id'] as String,
        title = json['title'] as String? ?? '',
        body = json['body'] as String? ?? '',
        createdAt = DateTime.parse(json['createdAt'] as String),
        read = json['readAt'] != null;

  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool read;
}

class StoredFile {
  StoredFile.fromJson(Map<String, dynamic> json)
      : id = json['id'] as String,
        name = json['originalName'] as String,
        mimeType = json['mimeType'] as String,
        sizeBytes = json['sizeBytes'] as int,
        createdAt = DateTime.parse(json['createdAt'] as String);

  final String id;
  final String name;
  final String mimeType;
  final int sizeBytes;
  final DateTime createdAt;
}

/// The API accepts these types (FilesService.ALLOWED_MIME); anything else is 415.
const uploadMimeTypes = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'webp': 'image/webp',
  'pdf': 'application/pdf',
  'txt': 'text/plain',
  'csv': 'text/csv',
};
