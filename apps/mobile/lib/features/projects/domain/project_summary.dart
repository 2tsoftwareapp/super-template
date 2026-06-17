class ProjectSummary {
  const ProjectSummary({
    required this.id,
    required this.name,
    required this.status,
    required this.description,
    this.isDeleted = false,
  });

  final String id;
  final String name;
  final String status;
  final String? description;
  final bool isDeleted;
}
