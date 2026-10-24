import { Injectable, inject, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  base64?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos = signal<UserPhoto[]>([]);
  private PHOTO_STORAGE: string = 'photos';
  private platform = inject(Platform);

  public async addNewToGallery(): Promise<UserPhoto> {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 95,
    });

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.update((photos) => [savedImageFile, ...photos]);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    return savedImageFile;
  }

  public async captureSlip(): Promise<{ base64: string; webviewPath: string }> {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
      quality: 90,
    });

    const base64 = `data:image/jpeg;base64,${photo.base64String}`;
    return {
      base64,
      webviewPath: photo.webPath || base64
    };
  }

  private async savePicture(photo: Photo): Promise<UserPhoto> {
    let base64Data: string;

    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      });
      base64Data = file.data as string;
    } else {
      base64Data = await this.base64FromPath(photo.webPath!);
    }

    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        base64: base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        base64: base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`
      };
    }
  }

  private async base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string');
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  public async loadSaved() {
    const { value: photoList } = await Preferences.get({ key: this.PHOTO_STORAGE });
    const photos = (photoList ? JSON.parse(photoList) : []) as UserPhoto[];

    if (!this.platform.is('hybrid')) {
      for (const photo of photos) {
        try {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
          photo.base64 = photo.webviewPath;
        } catch {}
      }
    }

    this.photos.set(photos);
  }
}
