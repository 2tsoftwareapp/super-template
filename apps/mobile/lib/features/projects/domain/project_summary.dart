class ProjectSummary {
  const ProjectSummary({
    required this.id,
    required this.name,
    required this.status,
    required this.description,
  });

  final String id;
  final String name;
  final String status;
  final String? description;
}
