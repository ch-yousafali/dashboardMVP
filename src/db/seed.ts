/**
 * Seed script — populates the database with the demo data from preview.html.
 * Run with: npx tsx src/db/seed.ts
 */
import 'dotenv/config';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { todayISO, addDays } from '@/lib/utils';

export async function seed() {
  const workspaceId = process.env.SEED_WORKSPACE_ID;
  if (!workspaceId) {
    console.error('Set SEED_WORKSPACE_ID in .env to the workspace ID you want to seed.');
    return;
  }

  const today = todayISO();
  console.log('Seeding workspace:', workspaceId);

  // Check existing data
  const existingEvents = await db.select({ id: schema.calendarEvents.id }).from(schema.calendarEvents).where(eq(schema.calendarEvents.workspaceId, workspaceId)).limit(1);
  if (existingEvents.length > 0) {
    console.log('Workspace already has data. Skipping seed.');
    process.exit(0);
  }

  // Calendar events
  await db.insert(schema.calendarEvents).values([
    { workspaceId, title: 'Supplier call — fabric batch #12', date: addDays(today, 1), time: '10:00 AM', type: 'meeting', notes: 'Discuss dye lot consistency.' },
    { workspaceId, title: 'Washing step — Batch A', date: addDays(today, 3), time: '', type: 'production', notes: '' },
    { workspaceId, title: 'Pre-order shipping deadline', date: addDays(today, 5), time: '', type: 'deadline', notes: 'Striped long sleeves must ship by EOD.' },
    { workspaceId, title: 'QC review — Batch B', date: addDays(today, 8), time: '2:00 PM', type: 'production', notes: '' },
    { workspaceId, title: 'Photoshoot for fall collection', date: addDays(today, -2), time: '', type: 'meeting', notes: '' },
  ]);

  // Video ideas
  await db.insert(schema.videoIdeas).values([
    { workspaceId, title: 'Restock day vlog', description: 'Behind the scenes unboxing new bulk order.', status: 'Idea', priority: 'Medium' },
    { workspaceId, title: 'How pre-orders work', description: 'Explain the pre-order timeline to new customers.', status: 'Planning', priority: 'High' },
    { workspaceId, title: 'Packing ASMR', description: 'Quiet packing video for the striped long sleeve drop.', status: 'In Progress', priority: 'Low' },
  ]);

  // Pre-orders
  await db.insert(schema.preOrders).values([
    { workspaceId, product: 'Striped Long Sleeve', orders: 142, status: 'In Production', expected: addDays(today, 4), shipping: addDays(today, 9), progress: 60 },
    { workspaceId, product: 'Ribbed Tank — Sage', orders: 88, status: 'Washing', expected: addDays(today, 2), shipping: addDays(today, 6), progress: 75 },
    { workspaceId, product: 'Cropped Hoodie', orders: 210, status: 'Sourced', expected: addDays(today, 12), shipping: addDays(today, 18), progress: 20 },
    { workspaceId, product: 'Linen Shorts — Sand', orders: 64, status: 'Shipped', expected: addDays(today, -3), shipping: addDays(today, -1), progress: 100 },
  ]);

  // Customer updates
  await db.insert(schema.customerUpdates).values([
    { workspaceId, product: 'Striped Long Sleeve', subject: 'Your striped long sleeve is in production', content: 'Quick update — your item is currently in production and on track.', state: 'Sent', date: addDays(today, -2) },
    { workspaceId, product: 'Ribbed Tank — Sage', subject: 'Ribbed tank moving to washing', content: 'Good news — your tank has finished production and is headed to washing.', state: 'Scheduled', date: addDays(today, 2) },
  ]);

  // Notes
  await db.insert(schema.notes).values([
    { workspaceId, text: 'Ask supplier about faster dye turnaround for winter drop.', pinned: true, date: addDays(today, -1) },
    { workspaceId, text: 'Reorder poly mailers — running low (under 200 left).', pinned: false, date: addDays(today, -4) },
    { workspaceId, text: 'Customer feedback: size run for hoodie could use a 2XL.', pinned: false, date: addDays(today, -8) },
  ]);

  // Important emails
  await db.insert(schema.importantEmails).values([
    { workspaceId, sender: 'Fabric House Co.', subject: 'Invoice #3391 — dye lot approved', date: addDays(today, -1), status: 'unread' },
    { workspaceId, sender: 'ShipFast Logistics', subject: 'Delay notice: carrier capacity this week', date: addDays(today, -2), status: 'flagged' },
    { workspaceId, sender: 'Studio Photography', subject: 'Fall shoot — proofs ready for review', date: addDays(today, -3), status: 'read' },
    { workspaceId, sender: 'Wholesale Buyer — Nora K.', subject: 'Interested in bulk order for boutique', date: addDays(today, -5), status: 'unread' },
  ]);

  // Bulk orders
  await db.insert(schema.bulkOrders).values([
    { workspaceId, supplier: 'Fabric House Co.', product: 'Cotton jersey — natural', quantity: 600, cost: 2400, date: addDays(today, -6), status: 'Delivered' },
    { workspaceId, supplier: 'Trimline Supply', product: 'Woven labels', quantity: 2000, cost: 340, date: addDays(today, -10), status: 'Delivered' },
    { workspaceId, supplier: 'Fabric House Co.', product: 'Ribbed knit — sage', quantity: 400, cost: 1850, date: addDays(today, -1), status: 'Processing' },
  ]);

  // Sales records
  await db.insert(schema.salesRecords).values([
    { workspaceId, orderId: '#10234', customer: 'Jenna R.', items: 2, total: 96, date: today },
    { workspaceId, orderId: '#10233', customer: 'Casey L.', items: 1, total: 42, date: today },
    { workspaceId, orderId: '#10232', customer: 'Priya S.', items: 3, total: 128, date: addDays(today, -1) },
    { workspaceId, orderId: '#10231', customer: 'Marcus D.', items: 1, total: 38, date: addDays(today, -1) },
    { workspaceId, orderId: '#10230', customer: 'Ana G.', items: 4, total: 210, date: addDays(today, -2) },
  ]);

  // Sales daily (last 7 days)
  const salesLast7 = [420, 610, 380, 720, 860, 540, 690];
  for (let i = 0; i < 7; i++) {
    await db.insert(schema.salesDaily).values({
      workspaceId,
      date: addDays(today, -(6 - i)),
      total: salesLast7[i],
      aov: 58,
    });
  }

  // Cost/profit
  await db.insert(schema.costProfit).values({
    workspaceId,
    monthlyCost: 8420,
    estimatedRevenue: 21300,
    breakdown: [
      { label: 'Materials', value: 4200, max: 8420 },
      { label: 'Shipping', value: 1600, max: 8420 },
      { label: 'Packaging', value: 820, max: 8420 },
      { label: 'Labor', value: 1500, max: 8420 },
      { label: 'Ads', value: 300, max: 8420 },
    ],
    monthlyProfit: [
      { m: 'Mar', profit: 4200 }, { m: 'Apr', profit: 5100 }, { m: 'May', profit: 3800 },
      { m: 'Jun', profit: 6200 }, { m: 'Jul', profit: 7100 }, { m: 'Aug', profit: 6880 },
    ],
  });

  // Samples
  await db.insert(schema.samples).values([
    { workspaceId, name: 'Sample — Ribbed Tank v2', product: 'Ribbed Tank', supplier: 'Fabric House Co.', status: 'In Production', submitted: addDays(today, -9), expected: addDays(today, 3) },
    { workspaceId, name: 'Sample — Cropped Hoodie', product: 'Cropped Hoodie', supplier: 'Trimline Supply', status: 'Received', submitted: addDays(today, -15), expected: addDays(today, -2) },
    { workspaceId, name: 'Sample — Linen Shorts v1', product: 'Linen Shorts', supplier: 'Fabric House Co.', status: 'Rejected', submitted: addDays(today, -20), expected: addDays(today, -9) },
  ]);

  // Tracking
  await db.insert(schema.tracking).values([
    { workspaceId, number: '1Z999AA10123456784', carrier: 'UPS', product: 'Linen Shorts — Sand', status: 'Out for Delivery', eta: today },
    { workspaceId, number: '9405511899223344556677', carrier: 'USPS', product: 'Ribbed Tank — Sage (bulk)', status: 'In Transit', eta: addDays(today, 4) },
    { workspaceId, number: '782910384756', carrier: 'FedEx', product: 'Woven labels', status: 'Delivered', eta: addDays(today, -6) },
  ]);

  // Notifications
  await db.insert(schema.notifications).values([
    { workspaceId, title: 'New calendar event', text: 'Supplier call scheduled for tomorrow at 10:00 AM.', time: '2 min ago', section: 'calendar', kind: 'calendar', read: false },
    { workspaceId, title: 'Order #32469 delivered', text: 'Linen Shorts — Sand has been delivered successfully.', time: '15 min ago', section: 'pre-orders', kind: 'order', read: false },
    { workspaceId, title: 'Shipment tracking updated', text: 'Your shipment is out for delivery and will arrive today.', time: '1 hr ago', section: 'tracking', kind: 'tracking', read: false },
    { workspaceId, title: 'New customer update', text: 'A customer update is ready to review.', time: '2 hrs ago', section: 'customer-updates', kind: 'customer', read: false },
    { workspaceId, title: 'New important email', text: 'Wholesale Buyer — Nora K. sent a new message.', time: '1 day ago', section: 'important-emails', kind: 'email', read: true },
  ]);

  // Activity
  await db.insert(schema.activity).values([
    { workspaceId, text: 'Pre-order updated', sub: 'Ribbed Tank — Sage moved to Washing', date: today },
    { workspaceId, text: 'Sample status changed', sub: 'Cropped Hoodie sample marked Received', date: addDays(today, -2) },
    { workspaceId, text: 'Customer update created', sub: 'Scheduled update for Ribbed Tank — Sage', date: addDays(today, -2) },
    { workspaceId, text: 'Bulk order added', sub: 'Ribbed knit — sage, 400 units', date: addDays(today, -1) },
    { workspaceId, text: 'Tracking information updated', sub: 'Linen Shorts shipment out for delivery', date: today },
  ]);

  console.log('Seed complete!');
}

// Run directly if executed as main script
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seed()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .then(() => process.exit(0));
}
