class InvitationSummary {
  const InvitationSummary({
    required this.id,
    required this.email,
    required this.status,
    required this.expiresAt,
  });

  final String id;
  final String email;
  final String status;
  final DateTime expiresAt;
}
