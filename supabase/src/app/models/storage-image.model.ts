export interface StorageImage {
  /** Nombre del fichero dentro del bucket (clave del objeto) */
  name: string;
  /** Ruta completa dentro del bucket, por ejemplo `fotos/perro.png` */
  path: string;
  /** URL lista para pintar en un <img> (firmada o pública) */
  url: string;
  /** Tamaño en bytes */
  size: number | null;
  /** MIME type del objeto */
  contentType: string | null;
  /** Fecha de última actualización */
  updatedAt: string | null;
}
