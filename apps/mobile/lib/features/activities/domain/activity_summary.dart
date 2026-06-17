class ActivitySummary {
  const ActivitySummary({
    required this.id,
    required this.summary,
    required this.actorId,
    required this.createdAt,
  });

  final String id;
  final String summary;
  final String? actorId;
  final DateTime createdAt;
}
