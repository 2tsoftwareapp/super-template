"use client";

import type { ReactNode } from "react";

import { useAdminLoginFlow } from "@/features/auth/controllers/use-admin-login-flow";

import { LoginCard } from "../ui/login-card";
import { LoginHero } from "../ui/login-hero";
import { LoginStatus } from "../ui/login-status";
import { MfaChallengeCard } from "../ui/mfa-challenge-card";

export function LoginView() {
  const login = useAdminLoginFlow();

  if (login.isCheckingExistingSession) {
    return <LoginStatus />;
  }

  if (login.isMfaChallenge) {
    return (
      <LoginScreen>
        <LoginHero
          eyebrow={login.mfaContent.eyebrow}
          title={login.mfaContent.title}
          description={login.mfaContent.description}
        />
        <MfaChallengeCard
          errorMessage={login.mfaErrorMessage}
          form={login.mfaForm}
          isPending={login.mfaMutation.isPending}
          onBack={login.resetMfaChallenge}
          onSubmit={login.handleMfaSubmit}
        />
      </LoginScreen>
    );
  }

  return (
    <LoginScreen>
      <LoginHero
        eyebrow={login.loginContent.eyebrow}
        title={login.loginContent.title}
        description={login.loginContent.description}
      />
      <LoginCard
        errorMessage={login.loginErrorMessage}
        form={login.loginForm}
        isPending={login.loginMutation.isPending}
        onSsoStart={login.handleSsoStart}
        onSubmit={login.handleLoginSubmit}
        ssoError={login.ssoError}
      />
    </LoginScreen>
  );
}

function LoginScreen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {children}
      </div>
    </div>
  );
}
