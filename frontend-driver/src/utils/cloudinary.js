export async function uploadImageToCloudinary(file) {
  if (!file) return '';

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dixxhk7pj';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cmms_preset';

  // 1. Try primary unsigned upload preset
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    if (data.error) {
      console.warn(`Cloudinary upload failed with preset "${uploadPreset}":`, data.error.message);
    }
  } catch (err) {
    console.warn('Direct Cloudinary upload network error:', err.message);
  }

  // 2. Try default fallback unsigned upload preset "ml_default" if primary failed
  if (uploadPreset !== 'ml_default') {
    try {
      const fallbackFormData = new FormData();
      fallbackFormData.append('file', file);
      fallbackFormData.append('upload_preset', 'ml_default');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fallbackFormData
      });
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      }
      if (data.error) {
        console.warn('Cloudinary upload failed with "ml_default" preset:', data.error.message);
      }
    } catch (err) {
      console.warn('Direct fallback upload error:', err.message);
    }
  }

  // 3. Fallback to backend in-memory streaming endpoint
  try {
    const backendFormData = new FormData();
    backendFormData.append('photo', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const backendRes = await fetch(`${apiUrl}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: backendFormData
    });
    const backendData = await backendRes.json();
    if (backendData.url) {
      return backendData.url;
    }
  } catch (err) {
    console.error('All Cloudinary upload attempts failed:', err);
  }

  return '';
}
