import QRCode from "qrcode";

const BASE_URL = (typeof window !== "undefined" ? window.location.origin : "");

export const qrService = {
  async generateForAluno(id: string): Promise<string> {
    const url = `${BASE_URL}/registar?id=${id}`;
    return QRCode.toDataURL(url, { width: 256, margin: 1 });
  },
};
