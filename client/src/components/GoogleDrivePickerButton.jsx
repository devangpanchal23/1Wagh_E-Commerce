import React, { useState, useEffect, useCallback } from 'react';
import { HardDrive, Loader2, Unplug, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fetchAdminApi } from '../api';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';

let scriptLoadPromise = null;

function loadGoogleScripts() {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    let loadedCount = 0;
    const checkDone = () => {
      loadedCount += 1;
      if (loadedCount === 2) resolve();
    };

    // Load GIS
    if (window.google?.accounts?.oauth2) {
      checkDone();
    } else {
      const scriptGis = document.createElement('script');
      scriptGis.src = GIS_SCRIPT_URL;
      scriptGis.async = true;
      scriptGis.defer = true;
      scriptGis.onload = checkDone;
      scriptGis.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
      document.body.appendChild(scriptGis);
    }

    // Load GAPI
    if (window.gapi) {
      checkDone();
    } else {
      const scriptGapi = document.createElement('script');
      scriptGapi.src = GAPI_SCRIPT_URL;
      scriptGapi.async = true;
      scriptGapi.defer = true;
      scriptGapi.onload = checkDone;
      scriptGapi.onerror = () => reject(new Error('Failed to load Google API script'));
      document.body.appendChild(scriptGapi);
    }
  });

  return scriptLoadPromise;
}

export function GoogleDrivePickerButton({ onFileSelected, isActive, onClickTab, maxImagesReached }) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [driveConnection, setDriveConnection] = useState({ connected: false, email: '' });
  const fetchGoogleConfig = async () => {
    try {
      const res = await fetchAdminApi('/admin/google-drive/config');
      if (res && res.success) {
        return { clientId: res.clientId || '', apiKey: res.apiKey || '' };
      }
    } catch (err) {
      console.error('Failed to fetch Google Drive config from server:', err);
    }
    return { clientId: '', apiKey: '' };
  };

  // Try to inspect Clerk user if available
  let clerkGoogleEmail = '';
  try {
    const clerk = window.Clerk;
    if (clerk && clerk.user) {
      const googleAccount = clerk.user.externalAccounts?.find(
        (acc) => acc.provider === 'google' || acc.verification?.strategy === 'from_oauth_google'
      );
      if (googleAccount && googleAccount.emailAddress) {
        clerkGoogleEmail = googleAccount.emailAddress;
      }
    }
  } catch (err) {
    // Clerk user optional
  }

  // Check connection status from backend
  const checkStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetchAdminApi('/admin/google-drive/status');
      if (res && res.success && res.connected) {
        setDriveConnection({ connected: true, email: res.email || '' });
      } else {
        setDriveConnection({ connected: false, email: '' });
      }
    } catch (err) {
      console.error('Failed to fetch Google Drive connection status:', err);
      setDriveConnection({ connected: false, email: '' });
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Initiate OAuth flow to connect user's Google Drive account
  const handleConnectAccount = async () => {
    setLoading(true);

    try {
      const { clientId } = await fetchGoogleConfig();
      if (!clientId) {
        addToast('Google Client ID is not configured on server.', 'error');
        setLoading(false);
        return;
      }

      await loadGoogleScripts();

      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        ux_mode: 'popup',
        callback: async (response) => {

          if (response.error) {
            console.error('Google OAuth code error:', response);
            if (response.error === 'access_denied' || response.error === 'popup_closed_by_user') {
              addToast('Google sign-in cancelled', 'info');
            } else {
              addToast(`Google sign-in failed: ${response.error}`, 'error');
            }
            setLoading(false);
            return;
          }

          if (response.code) {
            try {
              const res = await fetchAdminApi('/admin/google-drive/connect', {
                method: 'POST',
                body: JSON.stringify({
                  code: response.code,
                  redirectUri: 'postmessage',
                }),
              });

              if (res && res.success) {
                addToast(`Connected Google Drive (${res.email})`, 'success');
                setDriveConnection({ connected: true, email: res.email || '' });
                // Automatically launch picker after connecting
                handleOpenPickerWithAccessToken();
              } else {
                addToast(res?.message || 'Failed to store Google Drive connection', 'error');
              }
            } catch (err) {
              console.error('Failed to send auth code to server:', err);
              addToast('Server error while connecting Google Drive', 'error');
            }
          }
          setLoading(false);
        },
        error_callback: (err) => {
          console.error('Code client error:', err);
          addToast('Google sign-in cancelled', 'info');
          setLoading(false);
        },
      });

      codeClient.requestCode();
    } catch (err) {
      console.error('Failed to load Google scripts:', err);
      addToast('Failed to initialize Google login. Check your internet connection.', 'error');
      setLoading(false);
    }
  };

  // Fetch fresh access token from backend and open Picker
  const handleOpenPickerWithAccessToken = async () => {
    if (maxImagesReached) {
      addToast('Maximum 4 images allowed per product.', 'error');
      return;
    }

    setLoading(true);

    try {
      await loadGoogleScripts();

      const res = await fetchAdminApi('/admin/google-drive/access-token');
      if (!res || !res.success || !res.access_token) {
        if (res?.reauthRequired) {
          addToast('Google Drive connection expired or revoked. Please reconnect.', 'error');
          setDriveConnection({ connected: false, email: '' });
        } else {
          addToast(res?.message || 'Failed to get access token from server', 'error');
        }
        setLoading(false);
        return;
      }

      openPicker(res.access_token);
    } catch (err) {
      console.error('Failed to fetch access token:', err);
      addToast('Failed to authorize with Google Drive server.', 'error');
      setLoading(false);
    }
  };

  const openPicker = async (accessToken) => {
    if (!window.gapi) {
      addToast('Google API loader not available', 'error');
      setLoading(false);
      return;
    }

    const { apiKey } = await fetchGoogleConfig();

    window.gapi.load('picker', {
      callback: () => {
        try {
          const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
            .setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml')
            .setSelectFolderEnabled(false);

          const builder = new window.google.picker.PickerBuilder()
            .setOAuthToken(accessToken);

          if (apiKey) {
            builder.setDeveloperKey(apiKey);
          }

          builder
            .addView(docsView)
            .setCallback(async (data) => {

              if (data.action === window.google.picker.Action.PICKED) {
                const doc = data.docs?.[0];
                if (doc) {
                  const fileId = doc.id;
                  const fileName = doc.name || 'drive-image.jpg';
                  const mimeType = doc.mimeType || 'image/jpeg';
                  await fetchDriveFile(fileId, accessToken, fileName, mimeType);
                } else {
                  setLoading(false);
                }
              } else if (data.action === window.google.picker.Action.CANCEL) {
                setLoading(false);
              }
            });

          const picker = builder.build();
          picker.setVisible(true);
        } catch (err) {
          console.error('Error creating Google Drive picker:', err);
          addToast('Failed to open Google Drive picker', 'error');
          setLoading(false);
        }
      },
    });
  };

  const fetchDriveFile = async (fileId, accessToken, fileName, mimeType) => {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          addToast('Access token expired. Re-authenticating...', 'info');
          setDriveConnection({ connected: false, email: '' });
        }
        throw new Error(`Google Drive API error (${response.status})`);
      }

      const blob = await response.blob();
      const finalMime = mimeType || blob.type || 'image/jpeg';

      if (!finalMime.startsWith('image/')) {
        addToast('Selected file is not a valid image format.', 'error');
        setLoading(false);
        return;
      }

      const file = new File([blob], fileName, { type: finalMime });
      addToast('Image fetched from Google Drive successfully!', 'success');
      onFileSelected(file);
    } catch (err) {
      console.error('Failed to download image from Google Drive:', err);
      addToast('Failed to fetch image from Google Drive.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetchAdminApi('/admin/google-drive/disconnect', {
        method: 'DELETE',
      });
      if (res && res.success) {
        addToast('Google Drive account disconnected', 'info');
        setDriveConnection({ connected: false, email: '' });
      }
    } catch (err) {
      console.error('Failed to disconnect Google Drive:', err);
    }
  };

  const handleMainClick = () => {
    if (onClickTab) onClickTab();

    if (maxImagesReached) {
      addToast('Maximum 4 images allowed per product.', 'error');
      return;
    }

    if (driveConnection.connected) {
      handleOpenPickerWithAccessToken();
    } else {
      handleConnectAccount();
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={handleMainClick}
        disabled={loading || checkingStatus}
        className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          isActive
            ? 'bg-wagh-teal text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        } ${loading || checkingStatus ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {loading || checkingStatus ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : driveConnection.connected ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <HardDrive className="w-3.5 h-3.5" />
        )}

        <span>
          {checkingStatus
            ? 'Checking Drive...'
            : loading
            ? 'Processing...'
            : driveConnection.connected
            ? `Google Drive (${driveConnection.email || 'Connected'})`
            : clerkGoogleEmail
            ? `Use ${clerkGoogleEmail} for Drive`
            : 'Connect Google Drive'}
        </span>
      </button>

      {driveConnection.connected && (
        <button
          type="button"
          onClick={handleDisconnect}
          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
          title="Disconnect Google Drive Account"
        >
          <Unplug className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
