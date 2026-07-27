import PDFDocument from 'pdfkit';
import { TravelRequestRecord } from '../types/travel';

function formatSegmentTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export function generateTicketPdf(record: TravelRequestRecord): PDFKit.PDFDocument {
  const { employee, selectedOffer, booking } = record;
  if (!booking) {
    throw new Error('Cannot generate a ticket for a request that has not been booked');
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fontSize(20).text('E-Ticket Itinerary Receipt', { align: 'center' });
  doc.moveDown();

  doc.fontSize(11).fillColor('#555').text(`Booking reference (PNR): ${booking.pnr}`);
  doc.text(`Order ID: ${booking.orderId}`);
  doc.text(`Issued: ${formatSegmentTime(booking.bookedAt)}`);
  doc.moveDown();

  doc.fillColor('#000').fontSize(14).text('Passenger');
  doc.fontSize(11).fillColor('#333').text(`${employee.givenName} ${employee.familyName}`);
  doc.text(`Passport: ${employee.passportNumber}`);
  doc.text(`Email: ${employee.email}`);
  doc.moveDown();

  selectedOffer.itineraries.forEach((itinerary, idx) => {
    doc
      .fillColor('#000')
      .fontSize(14)
      .text(idx === 0 ? 'Outbound' : 'Return');

    itinerary.segments.forEach((seg) => {
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(`${seg.carrierName ?? seg.carrierCode} ${seg.flightNumber}`)
        .text(`${seg.from} ${formatSegmentTime(seg.departure)}  →  ${seg.to} ${formatSegmentTime(seg.arrival)}`);
      doc.moveDown(0.5);
    });
    doc.moveDown(0.5);
  });

  doc.fontSize(14).fillColor('#000').text('Fare');
  doc
    .fontSize(11)
    .fillColor('#333')
    .text(`Cabin: ${selectedOffer.cabin}`)
    .text(`Charged: ${booking.chargedCurrency} ${booking.chargedAmount}`);
  if (booking.fareRules) {
    doc.text(`Fare rules: ${booking.fareRules}`);
  }

  // Caller is responsible for piping this to a destination and calling
  // .end() afterward - ending before piping can drop buffered output.
  return doc;
}
