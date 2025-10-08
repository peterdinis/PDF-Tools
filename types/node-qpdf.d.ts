declare module "node-qpdf" {
  interface Restrictions {
    print?: "none" | "low" | "high";
    modify?: boolean;
    extract?: boolean;
    annotate?: boolean;
  }

  interface EncryptOptions {
    password?: string;   // user password
    keyLength?: 40 | 128 | 256;
    restrictions?: Restrictions;
  }

  export function encrypt(
    inputPath: string,
    outputPath: string,
    options: EncryptOptions
  ): void;
}
