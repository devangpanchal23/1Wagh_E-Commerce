/**
 * Builds every index declared in the Mongoose schemas against the live database.
 *
 * Production runs with `autoIndex: false` so boots stay fast and concurrent
 * instances don't race to build the same index. Run this once after deploying a
 * schema change:  npm run sync-indexes
 */
require('dotenv').config();

const { connectDB, mongoose } = require('../src/config/db');

// Registering the models is what makes their indexes known to Mongoose.
require('../src/models/User');
require('../src/models/Category');
require('../src/models/Product');
require('../src/models/Order');
require('../src/models/Cart');
require('../src/models/Review');
require('../src/models/Contact');
require('../src/models/Subscriber');
require('../src/models/GoogleDriveConnection');

(async () => {
  try {
    await connectDB();
    console.log('Building indexes...\n');

    let failed = 0;

    for (const name of mongoose.modelNames()) {
      const model = mongoose.model(name);
      try {
        // createIndexes() only adds what's missing. syncIndexes() would also DROP
        // any index not declared in the schema — not worth the risk on live data.
        await model.createIndexes();
        const indexes = await model.collection.indexes();
        console.log(`✅ ${name}: ${indexes.map((i) => i.name).join(', ')}`);
      } catch (err) {
        failed++;
        console.error(`❌ ${name}: ${err.message}`);
        if (err.code === 11000) {
          console.error(
            '   A unique index could not be built because the collection already ' +
            'contains duplicate values. Clean those up, then re-run.'
          );
        }
      }
    }

    console.log(failed === 0 ? '\n🎉 All indexes are in place.' : `\n⚠️ ${failed} model(s) failed.`);
    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('❌ Index sync failed:', err.message);
    process.exit(1);
  }
})();
