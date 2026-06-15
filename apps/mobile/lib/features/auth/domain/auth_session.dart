class AuthSession {
  const AuthSession({
    required this.userId,
    required this.email,
    required this.displayName,
    required this.roles,
    required this.permissions,
    required this.sessionId,
  });

  final String userId;
  final String email;
  final String displayName;
  final List<String> roles;
  final List<String> permissions;
  final String sessionId;

  bool get isAuthenticated => userId.isNotEmpty;
}
