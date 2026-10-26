/**
 * Utilitaires pour le chargement, la compression et l'optimisation des photos et vidéos
 * directement depuis un téléphone portable ou tablette.
 */

export interface CompressedImageResult {
  dataUrl: string;
  sizeMb: number;
  originalSizeMb: number;
  width: number;
  height: number;
  fileName: string;
}

export interface VideoMetadataResult {
  thumbnailUrl: string;
  durationText: string;
  durationSec: number;
  videoUrl: string;
  sizeMb: number;
  fileName: string;
}

/**
 * Compresse et redimensionne une photo prise depuis un téléphone portable
 * (permet de passer d'un fichier lourd de 10-20 Mo à un fichier web léger de 200-400 Ko sans perte visuelle)
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<CompressedImageResult> {
  const originalSizeMb = Number((file.size / (1024 * 1024)).toFixed(2));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcul des nouvelles dimensions proportionnelles
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Repli sur le dataUrl brut si canvas non supporté
          const rawUrl = e.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            sizeMb: originalSizeMb,
            originalSizeMb,
            width: img.width,
            height: img.height,
            fileName: file.name,
          });
          return;
        }

        // Lissage haute qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export en JPEG optimisé
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSizeMb = Number(
          ((compressedDataUrl.length * 3) / 4 / (1024 * 1024)).toFixed(2)
        );

        resolve({
          dataUrl: compressedDataUrl,
          sizeMb: approxSizeMb,
          originalSizeMb,
          width,
          height,
          fileName: file.name,
        });
      };

      img.onerror = () => {
        reject(new Error('Impossible de charger l’image pour la compression'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier depuis l’appareil'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Lit un fichier en tant que chaîne Data URL (Base64)
 */
export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extrait automatiquement une miniature et la durée d'une vidéo chargée depuis le téléphone
 * Pour les vidéos jusqu'à 30 Mo, convertit également le fichier en Data URL persistant pour qu'il soit
 * lisible sur tous les appareils et synchronisable en temps réel.
 */
export async function extractVideoMetadataAndThumbnail(
  file: File
): Promise<VideoMetadataResult> {
  const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
  const objectUrl = URL.createObjectURL(file);

  // Pour les fichiers raisonnables (< 32 Mo), charger le DataURL persistant
  let persistentDataUrl = '';
  if (file.size <= 32 * 1024 * 1024) {
    try {
      persistentDataUrl = await readFileAsDataUrl(file);
    } catch (e) {
      console.warn('Impossible de lire la vidéo en dataUrl, repli sur objectUrl:', e);
    }
  }

  const finalVideoUrl = persistentDataUrl || objectUrl;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    // Timeout de sécurité si la vidéo met trop de temps à charger ses métadonnées
    const timeout = setTimeout(() => {
      resolve({
        thumbnailUrl: '',
        durationText: 'Vidéo mobile',
        durationSec: 0,
        videoUrl: finalVideoUrl,
        sizeMb,
        fileName: file.name,
      });
    }, 6000);

    video.onloadedmetadata = () => {
      const durationSec = Math.round(video.duration || 0);
      let durationText = 'Vidéo mobile';

      if (durationSec > 0) {
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        if (mins > 0) {
          durationText = `${mins} min ${secs > 0 ? `${secs} s` : ''}`.trim();
        } else {
          durationText = `${secs} sec`;
        }
      }

      // Chercher une image à 1 seconde ou 25% de la durée
      const seekTime = Math.min(1.0, durationSec * 0.25 || 0.5);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 640, 640);
        const ratio = video.videoHeight / (video.videoWidth || 1);
        canvas.height = Math.round(canvas.width * (ratio || 0.5625));

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL('image/jpeg', 0.8);

          const durationSec = Math.round(video.duration || 0);
          const mins = Math.floor(durationSec / 60);
          const secs = durationSec % 60;
          const durationText =
            mins > 0 ? `${mins} min ${secs > 0 ? `${secs} s` : ''}`.trim() : `${secs} s`;

          resolve({
            thumbnailUrl: thumb,
            durationText,
            durationSec,
            videoUrl: finalVideoUrl,
            sizeMb,
            fileName: file.name,
          });
          return;
        }
      } catch (err) {
        console.warn('Impossible de capturer la miniature vidéo:', err);
      }

      resolve({
        thumbnailUrl: '',
        durationText: 'Vidéo mobile',
        durationSec: Math.round(video.duration || 0),
        videoUrl: finalVideoUrl,
        sizeMb,
        fileName: file.name,
      });
    };

    video.onerror = () => {
      clearTimeout(timeout);
      resolve({
        thumbnailUrl: '',
        durationText: 'Vidéo mobile',
        durationSec: 0,
        videoUrl: finalVideoUrl,
        sizeMb,
        fileName: file.name,
      });
    };
  });
}

