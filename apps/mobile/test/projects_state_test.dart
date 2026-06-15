import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/projects/domain/project_summary.dart';

void main() {
  test('project summary keeps empty-state compatible shape', () {
    const project = ProjectSummary(
      id: 'p1',
      name: 'Starter',
      status: 'ACTIVE',
      description: null,
    );

    expect(project.description, isNull);
  });
}
