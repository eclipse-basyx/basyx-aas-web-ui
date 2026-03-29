declare module 'qrcode' {
  interface ToDataUrlOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    margin?: number
    scale?: number
  }

  interface QRCodeModule {
    toDataURL: (text: string, options?: ToDataUrlOptions) => Promise<string>
  }

  const QRCode: QRCodeModule
  export default QRCode
}
