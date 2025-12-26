import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { encodeQR } from './qr.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Фотобумага 10x15 см
const PAGE_WIDTH_MM = 150;
const PAGE_HEIGHT_MM = 100;
const MM_TO_PT = 2.83465;

const PAGE_WIDTH = PAGE_WIDTH_MM * MM_TO_PT;
const PAGE_HEIGHT = PAGE_HEIGHT_MM * MM_TO_PT;

// Банковская карта 85.6 x 54 мм
const CARD_WIDTH = 85.6 * MM_TO_PT;
const CARD_HEIGHT = 54 * MM_TO_PT;

interface CardData {
  userId: string;
  name: string;
  cardNumber: string;
}

async function generateQRBuffer(data: string): Promise<Buffer> {
  const dataUrl = await QRCode.toDataURL(data, {
    width: 400,
    margin: 0,
    color: { dark: '#000000', light: '#ffffff' }
  });
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

export async function generateCardPDF(cards: CardData[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const chunks: Buffer[] = [];
    
    const doc = new PDFDocument({ 
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: 0
    });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fontRegular = join(__dirname, '../assets/Roboto-Regular.ttf');
    const fontBold = join(__dirname, '../assets/Roboto-Bold.ttf');
    doc.registerFont('Roboto', fontRegular);
    doc.registerFont('Roboto-Bold', fontBold);

    // Центрирование карточки на странице
    const x = (PAGE_WIDTH - CARD_WIDTH) / 2;
    const y = (PAGE_HEIGHT - CARD_HEIGHT) / 2;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      // Страница 1: лицевая сторона
      if (i > 0) doc.addPage();
      await drawFrontSide(doc, card, x, y, CARD_WIDTH, CARD_HEIGHT);
      
      // Страница 2: задняя сторона
      doc.addPage();
      drawBackSide(doc, card, x, y, CARD_WIDTH, CARD_HEIGHT);
    }

    doc.end();
  });
}

async function drawFrontSide(
  doc: PDFKit.PDFDocument, 
  card: CardData, 
  x: number, 
  y: number, 
  w: number, 
  h: number
) {
  const qrBuffer = await generateQRBuffer(encodeQR(card.userId));

  doc.save();

  // Фон
  const grad = doc.linearGradient(x, y, x + w, y + h);
  grad.stop(0, '#1a1a2e').stop(0.5, '#16213e').stop(1, '#0f3460');
  doc.roundedRect(x, y, w, h, 12).fill(grad);

  // Декор
  doc.opacity(0.1);
  doc.circle(x + w * 0.85, y + h * 0.2, w * 0.4).fill('#ff6b9d');
  doc.circle(x + w * 0.15, y + h * 0.85, w * 0.35).fill('#4ecdc4');
  doc.opacity(1);

  // Логотип
  doc.fillColor('#ff6b9d').fontSize(18).font('Roboto-Bold')
     .text('HOME BANK', x + 18, y + 15);

  // Чип
  const chipX = x + 18, chipY = y + 50;
  doc.roundedRect(chipX, chipY, 40, 32, 5).fill('#d4af37');
  doc.opacity(0.3);
  for (let i = 0; i < 4; i++) {
    doc.rect(chipX + 6, chipY + 6 + i * 6, 28, 2).fill('#000');
  }
  doc.rect(chipX + 19, chipY + 6, 2, 20).fill('#000');
  doc.opacity(1);

  // Имя
  doc.fillColor('#ffffff').fontSize(14).font('Roboto-Bold')
     .text(card.name.toUpperCase(), x + 18, y + h - 50, { width: w - 110 });

  // Номер
  doc.fillColor('#999999').fontSize(11).font('Roboto')
     .text(`**** **** **** ${card.cardNumber}`, x + 18, y + h - 28);

  // QR
  const qrSize = h * 0.52;
  const qrX = x + w - qrSize - 15;
  const qrY = y + (h - qrSize) / 2;
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5).fill('#ffffff');
  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

  doc.restore();
}

function drawBackSide(
  doc: PDFKit.PDFDocument, 
  card: CardData, 
  x: number, 
  y: number, 
  w: number, 
  h: number
) {
  doc.save();
  
  // Фон
  const grad = doc.linearGradient(x + w, y, x, y + h);
  grad.stop(0, '#1a1a2e').stop(0.5, '#16213e').stop(1, '#0f3460');
  doc.roundedRect(x, y, w, h, 12).fill(grad);

  // Декор
  doc.opacity(0.1);
  doc.circle(x + w * 0.15, y + h * 0.2, w * 0.4).fill('#4ecdc4');
  doc.circle(x + w * 0.85, y + h * 0.85, w * 0.35).fill('#ff6b9d');
  doc.opacity(1);

  // Магнитная полоса
  doc.rect(x, y + 22, w, 35).fill('#0a0a0a');
  doc.opacity(0.15);
  doc.rect(x, y + 35, w, 4).fill('#444');
  doc.rect(x, y + 45, w, 2).fill('#333');
  doc.opacity(1);

  // Панель подписи
  const panelY = y + h - 60;
  doc.roundedRect(x + 15, panelY, w - 30, 40, 6).fill('#f5f5f5');

  // Линии
  doc.strokeColor('#cccccc').lineWidth(0.5);
  for (let i = 0; i < 3; i++) {
    doc.moveTo(x + 22, panelY + 12 + i * 9)
       .lineTo(x + w * 0.52, panelY + 12 + i * 9).stroke();
  }

  // CVV
  const cvvX = x + w * 0.58;
  doc.roundedRect(cvvX, panelY + 8, w * 0.28, 25, 4).fill('#fff');
  doc.strokeColor('#ddd').roundedRect(cvvX, panelY + 8, w * 0.28, 25, 4).stroke();
  doc.fillColor('#888').fontSize(8).font('Roboto').text('CVV', cvvX + 6, panelY + 13);
  doc.fillColor('#333').fontSize(13).font('Roboto-Bold').text('***', cvvX + 35, panelY + 13);

  // Логотип
  doc.fillColor('#ff6b9d').fontSize(11).font('Roboto-Bold')
     .text('HOME BANK', x + w - 95, y + h - 18);

  doc.restore();
}

export async function generateSingleCardPDF(card: CardData): Promise<Buffer> {
  return generateCardPDF([card]);
}
