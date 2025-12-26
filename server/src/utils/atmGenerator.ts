import PDFDocument from 'pdfkit';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MM = 2.83465; // mm to points

// Планшет: 187.6 x 103.7 x 8.6 мм
const TABLET_W = 187.6;
const TABLET_H = 103.7;
const TABLET_D = 8.6;

// Карта: 85.6 x 54 мм
const CARD_W = 85.6;
const CARD_H = 54;

export async function generateATMPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 20 });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fontRegular = join(__dirname, '../assets/Roboto-Regular.ttf');
    const fontBold = join(__dirname, '../assets/Roboto-Bold.ttf');
    doc.registerFont('Roboto', fontRegular);
    doc.registerFont('Roboto-Bold', fontBold);

    // === СТРАНИЦА 1: Основной корпус ===
    drawMainBody(doc);

    // === СТРАНИЦА 2: Козырёк со слотом для карты ===
    doc.addPage();
    drawTopCanopy(doc);

    // === СТРАНИЦА 3: Боковые панели ===
    doc.addPage();
    drawSidePanels(doc);

    // === СТРАНИЦА 4: Инструкция ===
    doc.addPage();
    drawInstructions(doc);

    doc.end();
  });
}

function drawMainBody(doc: PDFKit.PDFDocument) {
  const startX = 50;
  const startY = 50;

  doc.fontSize(16).font('Roboto-Bold').fillColor('#333')
     .text('ОСНОВНОЙ КОРПУС БАНКОМАТА', startX, 20);
  doc.fontSize(10).font('Roboto').fillColor('#666')
     .text('Вырежьте по сплошной линии, согните по пунктирной', startX, 38);

  // Размеры корпуса
  const frontW = TABLET_W + 20; // +20мм на рамку
  const frontH = TABLET_H + 80; // +80мм сверху для "головы" банкомата
  const sideD = 50; // глубина корпуса
  const bottomH = 30; // клапан снизу

  // Передняя панель
  const fx = startX + sideD * MM;
  const fy = startY;
  
  // Рисуем развёртку
  doc.strokeColor('#000').lineWidth(1);
  
  // Левая боковина (для склейки)
  doc.rect(startX, fy, sideD * MM, frontH * MM).stroke();
  drawDashedLine(doc, startX + sideD * MM, fy, startX + sideD * MM, fy + frontH * MM);

  // Передняя панель
  doc.rect(fx, fy, frontW * MM, frontH * MM).stroke();
  
  // Вырез для экрана планшета
  const screenX = fx + 10 * MM;
  const screenY = fy + 60 * MM;
  doc.rect(screenX, screenY, TABLET_W * MM, TABLET_H * MM).stroke();
  doc.fillColor('#e0e0e0').rect(screenX, screenY, TABLET_W * MM, TABLET_H * MM).fill();
  doc.fillColor('#999').fontSize(8).font('Roboto')
     .text('ВЫРЕЗ ДЛЯ ЭКРАНА', screenX + 50 * MM, screenY + 45 * MM);

  // Правая боковина
  const rx = fx + frontW * MM;
  drawDashedLine(doc, rx, fy, rx, fy + frontH * MM);
  doc.strokeColor('#000').rect(rx, fy, sideD * MM, frontH * MM).stroke();

  // Верхний клапан (для крепления козырька)
  drawDashedLine(doc, fx, fy, rx, fy);
  doc.rect(fx, fy - 25 * MM, frontW * MM, 25 * MM).stroke();
  doc.fillColor('#999').fontSize(8).text('КЛАПАН ДЛЯ КОЗЫРЬКА', fx + 60 * MM, fy - 18 * MM);

  // Нижний клапан
  drawDashedLine(doc, fx, fy + frontH * MM, rx, fy + frontH * MM);
  doc.strokeColor('#000').rect(fx, fy + frontH * MM, frontW * MM, bottomH * MM).stroke();
  doc.fillColor('#999').fontSize(8).text('КЛАПАН ДЛЯ ДНА', fx + 70 * MM, fy + frontH * MM + 10 * MM);

  // Декор на передней панели - "HOME BANK"
  doc.fillColor('#ff6b9d').fontSize(24).font('Roboto-Bold')
     .text('HOME BANK', fx + 45 * MM, fy + 15 * MM);

  // Индикатор слота для карты (стрелка)
  doc.fillColor('#333').fontSize(10).font('Roboto')
     .text('↑ ВСТАВТЕ КАРТКУ', fx + 65 * MM, fy + 45 * MM);
}

function drawTopCanopy(doc: PDFKit.PDFDocument) {
  const startX = 50;
  const startY = 80;

  doc.fontSize(16).font('Roboto-Bold').fillColor('#333')
     .text('КОЗЫРЁК СО СЛОТОМ ДЛЯ КАРТЫ', startX, 20);
  doc.fontSize(10).font('Roboto').fillColor('#666')
     .text('Важно: окошко над слотом НЕ заклеивать - через него падает свет для камеры!', startX, 38);

  const canopyW = TABLET_W + 20;
  const canopyD = 80; // глубина козырька
  const canopyFrontH = 40; // высота переднего края

  // Верхняя часть козырька (горизонтальная)
  const tx = startX;
  const ty = startY;
  
  doc.strokeColor('#000').lineWidth(1);
  doc.rect(tx, ty, canopyW * MM, canopyD * MM).stroke();

  // Слот для карты (вырез)
  const slotX = tx + (canopyW - CARD_W - 10) / 2 * MM;
  const slotY = ty + 20 * MM;
  const slotW = (CARD_W + 10) * MM;
  const slotH = 15 * MM;
  
  doc.rect(slotX, slotY, slotW, slotH).stroke();
  doc.fillColor('#ffeb3b').rect(slotX, slotY, slotW, slotH).fill();
  doc.fillColor('#333').fontSize(8).font('Roboto')
     .text('ВЫРЕЗ - СЛОТ ДЛЯ КАРТЫ', slotX + 15 * MM, slotY + 4 * MM);

  // Окошко для света (рядом со слотом, ближе к камере)
  const windowX = slotX + slotW + 10 * MM;
  const windowY = slotY;
  const windowW = 30 * MM;
  const windowH = 15 * MM;
  
  doc.rect(windowX, windowY, windowW, windowH).stroke();
  doc.fillColor('#87ceeb').rect(windowX, windowY, windowW, windowH).fill();
  doc.fillColor('#333').fontSize(6).font('Roboto')
     .text('ОКНО ДЛЯ СВЕТА', windowX + 2 * MM, windowY + 5 * MM);

  // Передний край козырька
  drawDashedLine(doc, tx, ty + canopyD * MM, tx + canopyW * MM, ty + canopyD * MM);
  doc.strokeColor('#000')
     .rect(tx, ty + canopyD * MM, canopyW * MM, canopyFrontH * MM).stroke();
  
  doc.fillColor('#1a1a2e').rect(tx + 2, ty + canopyD * MM + 2, canopyW * MM - 4, canopyFrontH * MM - 4).fill();
  doc.fillColor('#ff6b9d').fontSize(14).font('Roboto-Bold')
     .text('HOME BANK', tx + 55 * MM, ty + canopyD * MM + 12 * MM);

  // Боковые клапаны
  drawDashedLine(doc, tx, ty, tx, ty + canopyD * MM + canopyFrontH * MM);
  doc.strokeColor('#000').rect(tx - 25 * MM, ty, 25 * MM, canopyD * MM).stroke();
  doc.fillColor('#999').fontSize(7).text('КЛАПАН', tx - 20 * MM, ty + 30 * MM);

  drawDashedLine(doc, tx + canopyW * MM, ty, tx + canopyW * MM, ty + canopyD * MM + canopyFrontH * MM);
  doc.strokeColor('#000').rect(tx + canopyW * MM, ty, 25 * MM, canopyD * MM).stroke();
  doc.fillColor('#999').fontSize(7).text('КЛАПАН', tx + canopyW * MM + 5 * MM, ty + 30 * MM);

  // Задний клапан (крепится к корпусу)
  drawDashedLine(doc, tx, ty, tx + canopyW * MM, ty);
  doc.strokeColor('#000').rect(tx, ty - 30 * MM, canopyW * MM, 30 * MM).stroke();
  doc.fillColor('#999').fontSize(8).text('ПРИКЛЕИТЬ К ВЕРХУ КОРПУСА', tx + 40 * MM, ty - 18 * MM);
}

function drawSidePanels(doc: PDFKit.PDFDocument) {
  const startX = 50;
  const startY = 80;

  doc.fontSize(16).font('Roboto-Bold').fillColor('#333')
     .text('ЗАДНЯЯ СТЕНКА И ПОЛКА ДЛЯ ПЛАНШЕТА', startX, 20);
  doc.fontSize(10).font('Roboto').fillColor('#666')
     .text('Полка держит планшет под углом для удобного сканирования', startX, 38);

  const backW = TABLET_W + 20;
  const backH = TABLET_H + 80;

  // Задняя стенка
  doc.strokeColor('#000').lineWidth(1);
  doc.rect(startX, startY, backW * MM, backH * MM).stroke();
  
  doc.fillColor('#999').fontSize(10).font('Roboto')
     .text('ЗАДНЯЯ СТЕНКА', startX + 60 * MM, startY + 80 * MM);

  // Клапаны для склейки
  doc.rect(startX - 20 * MM, startY, 20 * MM, backH * MM).stroke();
  doc.rect(startX + backW * MM, startY, 20 * MM, backH * MM).stroke();
  drawDashedLine(doc, startX, startY, startX, startY + backH * MM);
  drawDashedLine(doc, startX + backW * MM, startY, startX + backW * MM, startY + backH * MM);

  // Полка для планшета
  const shelfX = startX + backW * MM + 80 * MM;
  const shelfW = TABLET_W + 10;
  const shelfD = 40;

  doc.rect(shelfX, startY, shelfW * MM, shelfD * MM).stroke();
  doc.fillColor('#999').fontSize(10)
     .text('ПОЛКА ДЛЯ ПЛАНШЕТА', shelfX + 40 * MM, startY + 15 * MM);
  doc.fontSize(8).text('(приклеить внутри под углом)', shelfX + 35 * MM, startY + 25 * MM);

  // Упор для планшета
  const stopX = shelfX;
  const stopY = startY + shelfD * MM + 20 * MM;
  doc.rect(stopX, stopY, shelfW * MM, 20 * MM).stroke();
  doc.fillColor('#999').fontSize(8)
     .text('УПОР - согнуть и приклеить к полке', stopX + 30 * MM, stopY + 6 * MM);
  drawDashedLine(doc, stopX, stopY, stopX + shelfW * MM, stopY);
}

function drawInstructions(doc: PDFKit.PDFDocument) {
  doc.fontSize(20).font('Roboto-Bold').fillColor('#333')
     .text('ИНСТРУКЦИЯ ПО СБОРКЕ', 50, 30);

  const instructions = [
    '1. Вырежьте все детали по СПЛОШНЫМ линиям',
    '2. Согните по ПУНКТИРНЫМ линиям',
    '3. Вырежьте отверстие для экрана планшета в передней панели',
    '4. Вырежьте слот для карты и окошко для света в козырьке',
    '5. Склейте основной корпус (коробка без верха)',
    '6. Приклейте заднюю стенку',
    '7. Установите полку для планшета внутри под небольшим углом назад',
    '8. Приклейте козырёк сверху',
    '',
    'КАК ЭТО РАБОТАЕТ:',
    '• Пользователь вставляет карту в слот QR-кодом ВВЕРХ',
    '• Свет падает через окошко рядом со слотом',
    '• Фронтальная камера планшета направлена вверх и видит QR-код',
    '• Выглядит как настоящий банкомат - карта "проглатывается"',
    '',
    'РАЗМЕРЫ:',
    `• Планшет: ${TABLET_W} x ${TABLET_H} x ${TABLET_D} мм`,
    `• Карта: ${CARD_W} x ${CARD_H} мм`,
    '• Корпус: ~210 x 185 x 50 мм',
  ];

  doc.fontSize(11).font('Roboto').fillColor('#333');
  let y = 70;
  for (const line of instructions) {
    doc.text(line, 50, y);
    y += 18;
  }

  // Схема
  doc.fontSize(12).font('Roboto-Bold').text('СХЕМА (вид сбоку):', 450, 70);
  
  const sx = 450, sy = 100;
  doc.strokeColor('#333').lineWidth(2);
  
  // Корпус
  doc.rect(sx, sy, 100, 150).stroke();
  
  // Козырёк
  doc.moveTo(sx, sy).lineTo(sx + 60, sy - 40).lineTo(sx + 100, sy - 40).lineTo(sx + 100, sy).stroke();
  
  // Слот
  doc.strokeColor('#ff6b9d').lineWidth(3);
  doc.moveTo(sx + 30, sy - 40).lineTo(sx + 70, sy - 40).stroke();
  
  // Планшет (под углом)
  doc.strokeColor('#4ecdc4').lineWidth(2);
  doc.moveTo(sx + 10, sy + 140).lineTo(sx + 20, sy + 30).stroke();
  
  // Подписи
  doc.fontSize(8).font('Roboto').fillColor('#333');
  doc.text('слот', sx + 40, sy - 55);
  doc.text('планшет', sx + 25, sy + 80);
  doc.text('камера ↑', sx + 5, sy + 25);
  doc.fillColor('#87ceeb').text('свет ↓', sx + 75, sy - 55);
}

function drawDashedLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number) {
  doc.save();
  doc.strokeColor('#666').lineWidth(0.5).dash(5, { space: 3 });
  doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  doc.undash();
  doc.restore();
}
