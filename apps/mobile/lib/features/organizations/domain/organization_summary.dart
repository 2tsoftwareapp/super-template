class OrganizationSummary {
  const OrganizationSummary({
    required this.id,
    required this.name,
    required this.slug,
    required this.role,
    required this.isCurrent,
  });

  final String id;
  final String name;
  final String slug;
  final String role;
  final bool isCurrent;
}
