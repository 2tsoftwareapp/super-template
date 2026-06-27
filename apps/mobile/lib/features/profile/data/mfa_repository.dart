import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/errors/app_exception.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:super_template_api/super_template_api.dart';

final mfaRepositoryProvider = Provider<MfaRepository>(
  (ref) => MfaRepository(ref.watch(apiClientProvider)),
);

class MfaSetupInfo {
  const MfaSetupInfo({required this.secret, required this.otpauthUrl});

  final String secret;
  final String otpauthUrl;
}

class MfaRepository {
  MfaRepository(this._client);

  final SuperTemplateApi _client;
  MfaApi get _api => _client.getMfaApi();

  Future<bool> getStatus() async {
    try {
      final response = await _api.mfaControllerGetStatus();
      return response.data!.data.enabled;
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<MfaSetupInfo> setup() async {
    try {
      final response = await _api.mfaControllerSetup();
      return MfaSetupInfo(
        secret: response.data!.data.secret,
        otpauthUrl: response.data!.data.otpauthUrl,
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<String>> confirm(String code) async {
    try {
      final response = await _api.mfaControllerConfirm(
        mfaCodeDto: MfaCodeDto((b) => b..code = code),
      );
      return response.data!.data.recoveryCodes.toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<void> disable(String code) async {
    try {
      await _api.mfaControllerDisable(
        mfaCodeDto: MfaCodeDto((b) => b..code = code),
      );
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }

  Future<List<String>> regenerateRecoveryCodes(String code) async {
    try {
      final response = await _api.mfaControllerRegenerateRecoveryCodes(
        mfaCodeDto: MfaCodeDto((b) => b..code = code),
      );
      return response.data!.data.recoveryCodes.toList();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
