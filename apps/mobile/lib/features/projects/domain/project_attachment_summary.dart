class ProjectAttachmentSummary {
  const ProjectAttachmentSummary({
    required this.id,
    required this.fileId,
    required this.label,
    required this.createdAt,
  });

  final String id;
  final String fileId;
  final String? label;
  final DateTime createdAt;
}
