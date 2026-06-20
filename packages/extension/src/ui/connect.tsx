/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Status =
  | { type: 'connecting'; message: string }
  | { type: 'connected'; message: string }
  | { type: 'error'; message: string }
  | { type: 'error'; versionMismatch: { extensionVersion: string; } };

const SUPPORTED_PROTOCOL_VERSION = 2;

const ConnectApp: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [clientInfo, setClientInfo] = useState('unknown');

  const setError = useCallback((message: string) => {
    setStatus({ type: 'error', message });
  }, []);

  useEffect(() => {
    const runAsync = async () => {
      const params = new URLSearchParams(window.location.search);
      const relayUrl = params.get('mcpRelayUrl');

      if (!relayUrl) {
        setError('Missing mcpRelayUrl parameter in URL.');
        return;
      }

      try {
        const host = new URL(relayUrl).hostname;
        if (host !== '127.0.0.1' && host !== '[::1]') {
          setError(`Browser Control only allows loopback connections (127.0.0.1 or [::1]). Received host: ${host}`);
          return;
        }
      } catch (e) {
        setError(`Invalid mcpRelayUrl parameter in URL: ${relayUrl}. ${e}`);
        return;
      }

      try {
        const client = JSON.parse(params.get('client') || '{}');
        const info = `${client.name || 'unknown'}`;
        setClientInfo(info);
        setStatus({
          type: 'connecting',
          message: `"${info}" is trying to connect to Browser Control.`
        });
      } catch (e) {
        setStatus({ type: 'error', message: 'Failed to parse client version.' });
        return;
      }

      const parsedVersion = parseInt(params.get('protocolVersion') ?? '', 10);
      const requestedVersion = isNaN(parsedVersion) ? 1 : parsedVersion;
      if (requestedVersion > SUPPORTED_PROTOCOL_VERSION) {
        const extensionVersion = chrome.runtime.getManifest().version;
        setStatus({
          type: 'error',
          versionMismatch: {
            extensionVersion,
          }
        });
        return;
      }

      const currentTab = await chrome.tabs.getCurrent();
      const selectorTabId = currentTab?.id;
      if (selectorTabId === undefined) {
        setError('Unable to determine the current browser tab.');
        return;
      }
      // The background decides per protocolVersion: v1 opens the relay WS
      // immediately (the daemon expects a prompt connection); v2 just records
      // the descriptor and defers the WS until the user clicks Allow.
      const response = await chrome.runtime.sendMessage({
        type: 'connectionRequested',
        mcpRelayUrl: relayUrl,
        protocolVersion: requestedVersion,
        selectorTabId,
      });
      if (!response.success) {
        setError(response.error);
        return;
      }

      await handleConnectToTab(selectorTabId);
    };
    void runAsync();
    // Ping the background every 20s so the MV3 service worker (which owns the
    // relay WebSocket) stays above its 30s idle timeout while the user decides.
    const keepalive = setInterval(() => {
      chrome.runtime.sendMessage({ type: 'keepalive' }).catch(() => {});
    }, 20_000);
    return () => clearInterval(keepalive);
  }, []);

  const handleConnectToTab = useCallback(async (selectorTabId: number, tab?: chrome.tabs.Tab) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'connectToTab',
        tab,
        clientName: clientInfo,
        selectorTabId,
      });

      if (response?.success) {
        setStatus({ type: 'connected', message: `"${clientInfo}" connected.` });
      } else {
        setStatus({
          type: 'error',
          message: response?.error || `"${clientInfo}" failed to connect.`
        });
      }
    } catch (e) {
      setStatus({
        type: 'error',
      message: `"${clientInfo}" failed to connect: ${e}`
      });
    }
  }, [clientInfo]);

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === 'pendingConnectionClosed') {
        setError('Pending client connection closed.');
        document.title = 'Browser Control';
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [setError]);

  return (
    <div className='app-container'>
      <div className='content-wrapper'>
        {status && (
          <div className='status-container'>
            <StatusBanner status={status} />
          </div>
        )}
      </div>
    </div>
  );
};

const VersionMismatchError: React.FC<{ extensionVersion: string }> = ({ extensionVersion }) => {
  const readmeUrl = 'https://github.com/microsoft/playwright/blob/main/packages/extension/README.md';
  const chromeWebStoreUrl = 'https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm';
  return (
    <div>
      Browser Control client trying to connect requires newer extension version (current version: {extensionVersion}).{' '}
      Update <a href={chromeWebStoreUrl} target='_blank' rel='noopener noreferrer'>Browser Control</a> from the Chrome Web Store to the latest version.{' '}
      See <a href={readmeUrl} target='_blank' rel='noopener noreferrer'>installation instructions</a> for more details.
    </div>
  );
};

const StatusBanner: React.FC<{ status: Status }> = ({ status }) => {
  return (
    <div className={`status-banner ${status.type}`}>
      {'versionMismatch' in status ? (
        <VersionMismatchError
          extensionVersion={status.versionMismatch.extensionVersion}
        />
      ) : (
        status.message
      )}
    </div>
  );
};

// Initialize the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ConnectApp />);
}
