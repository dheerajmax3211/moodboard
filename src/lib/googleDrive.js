import { GOOGLE_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_APP_ID, GOOGLE_DRIVE_FOLDER_ID } from '../config';

let pickerApiLoaded = false;
let gisLoaded = false;
let tokenClient = null;
let accessToken = null;

// Load Google API scripts
export function loadGoogleDriveApi() {
    return new Promise((resolve, reject) => {
        // Load the Google API client library
        if (!document.getElementById('google-api-script')) {
            const script = document.createElement('script');
            script.id = 'google-api-script';
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('picker', () => {
                    pickerApiLoaded = true;
                    checkAllLoaded(resolve);
                });
            };
            script.onerror = reject;
            document.body.appendChild(script);
        } else {
            pickerApiLoaded = true;
            checkAllLoaded(resolve);
        }

        // Load Google Identity Services
        if (!document.getElementById('google-gis-script')) {
            const gisScript = document.createElement('script');
            gisScript.id = 'google-gis-script';
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.onload = () => {
                gisLoaded = true;
                initializeTokenClient();
                checkAllLoaded(resolve);
            };
            gisScript.onerror = reject;
            document.body.appendChild(gisScript);
        } else {
            gisLoaded = true;
            checkAllLoaded(resolve);
        }
    });
}

function checkAllLoaded(resolve) {
    if (pickerApiLoaded && gisLoaded) {
        resolve();
    }
}

function initializeTokenClient() {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: () => { }, // Will be set when needed
    });
}

// Get access token (will prompt user to sign in if needed)
function getAccessToken() {
    return new Promise((resolve, reject) => {
        if (accessToken) {
            resolve(accessToken);
            return;
        }

        tokenClient.callback = (response) => {
            if (response.error) {
                reject(response);
                return;
            }
            accessToken = response.access_token;
            resolve(accessToken);
        };

        tokenClient.requestAccessToken({ prompt: '' });
    });
}

// Upload file to Google Drive
async function uploadFileToDrive(file) {
    const token = await getAccessToken();

    // Create metadata
    const metadata = {
        name: file.name,
        mimeType: file.type,
    };

    // Add to folder if specified
    if (GOOGLE_DRIVE_FOLDER_ID && GOOGLE_DRIVE_FOLDER_ID !== 'YOUR_FOLDER_ID_OPTIONAL') {
        metadata.parents = [GOOGLE_DRIVE_FOLDER_ID];
    }

    // Create form data for multipart upload
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: form,
        }
    );

    if (!response.ok) {
        throw new Error('Failed to upload file to Google Drive');
    }

    const data = await response.json();

    // Make the file publicly accessible
    await makeFilePublic(data.id, token);

    return {
        driveFileId: data.id,
        filename: data.name,
        driveUrl: `https://drive.google.com/thumbnail?id=${data.id}&sz=w1000`,
    };
}

// Make file publicly viewable
async function makeFilePublic(fileId, token) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
        }),
    });
}

// Upload multiple files
export async function uploadImages(files, onProgress) {
    await loadGoogleDriveApi();

    const results = [];
    let completed = 0;

    for (const file of files) {
        try {
            const result = await uploadFileToDrive(file);
            results.push(result);
            completed++;
            if (onProgress) {
                onProgress(completed, files.length);
            }
        } catch (error) {
            console.error('Failed to upload:', file.name, error);
            // Continue with other files
        }
    }

    return results;
}

// Open Google Picker to select existing images from Drive
export function openDrivePicker() {
    return new Promise(async (resolve, reject) => {
        try {
            await loadGoogleDriveApi();
            const token = await getAccessToken();

            const picker = new window.google.picker.PickerBuilder()
                .addView(new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
                    .setIncludeFolders(true)
                    .setSelectFolderEnabled(false))
                .setOAuthToken(token)
                .setDeveloperKey(GOOGLE_API_KEY)
                .setAppId(GOOGLE_APP_ID)
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const files = data.docs.map(doc => ({
                            driveFileId: doc.id,
                            filename: doc.name,
                            driveUrl: `https://drive.google.com/thumbnail?id=${doc.id}&sz=w1000`,
                        }));
                        resolve(files);
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        resolve([]);
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (error) {
            reject(error);
        }
    });
}
