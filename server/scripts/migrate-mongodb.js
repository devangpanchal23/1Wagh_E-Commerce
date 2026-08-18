/**
 * MongoDB Full Migration Script
 * Migrates all databases, collections, schemas (indexes), and data 
 * from Source MongoDB Cluster to Destination MongoDB Cluster.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function migrate() {
  let sourceUri = process.env.SOURCE_MONGODB_URI || process.argv[2];
  let destUri = process.env.DEST_MONGODB_URI || process.argv[3];

  if (!sourceUri || !destUri) {
    console.error('❌ Error: Missing connection URIs.');
    console.log('\nUsage:');
    console.log('  node scripts/migrate-mongodb.js "<SOURCE_URI_WITH_CREDS>" "<DEST_URI_WITH_CREDS>"');
    console.log('\nExample:');
    console.log('  node scripts/migrate-mongodb.js "mongodb+srv://myUser:myPass@waghonline.2dfbnfk.mongodb.net/?appName=WaghOnline" "mongodb+srv://myUser:myPass@waghonline.kism57h.mongodb.net/?appName=WaghOnline"');
    process.exit(1);
  }

  // Check for unresolved placeholders
  if (sourceUri.includes('<') || sourceUri.includes('>') || destUri.includes('<') || destUri.includes('>')) {
    console.error('\n❌ ERROR: Connection strings contain unreplaced placeholders like <YOUR_USER> or <db_password>!');
    console.error('👉 You must replace <YOUR_USER> and <YOUR_PASSWORD> with your actual MongoDB Atlas Database User credentials.\n');
    console.log('Step-by-step fix:');
    console.log('1. Go to MongoDB Atlas (https://cloud.mongodb.com/)');
    console.log('2. Click on "Database Access" under Security in the left sidebar.');
    console.log('3. Find or create a Database User (e.g. username: admin, set a password).');
    console.log('4. Ensure Network Access (IP Access List) allows 0.0.0.0/0 or your current IP.');
    console.log('5. Re-run this command with the real username and password:\n');
    console.log('   node scripts/migrate-mongodb.js \\');
    console.log('     "mongodb+srv://USERNAME:PASSWORD@waghonline.2dfbnfk.mongodb.net/?appName=WaghOnline" \\');
    console.log('     "mongodb+srv://USERNAME:PASSWORD@waghonline.kism57h.mongodb.net/?appName=WaghOnline"\n');
    process.exit(1);
  }

  console.log('🚀 Starting MongoDB Migration...');
  console.log(`📍 Source Cluster Host:      ${extractHost(sourceUri)}`);
  console.log(`📍 Destination Cluster Host: ${extractHost(destUri)}\n`);

  const sourceClient = new MongoClient(sourceUri);
  const destClient = new MongoClient(destUri);

  try {
    console.log('🔌 Connecting to Source Cluster (Wagh Org)...');
    await sourceClient.connect();
    console.log('✅ Connected to Source Cluster.');

    console.log('🔌 Connecting to Destination Cluster (Vercel Org)...');
    await destClient.connect();
    console.log('✅ Connected to Destination Cluster.\n');

    // List all databases from source
    const adminDb = sourceClient.db().admin();
    const { databases } = await adminDb.listDatabases();

    // Filter out system databases
    const targetDatabases = databases.filter(
      (db) => !['admin', 'local', 'config'].includes(db.name)
    );

    console.log(`📁 Found ${targetDatabases.length} database(s) to migrate: ${targetDatabases.map(d => d.name).join(', ')}\n`);

    for (const dbInfo of targetDatabases) {
      const dbName = dbInfo.name;
      console.log(`==================================================`);
      console.log(`📦 Processing Database: ${dbName}`);
      console.log(`==================================================`);

      const srcDb = sourceClient.db(dbName);
      const destDb = destClient.db(dbName);

      const collections = await srcDb.listCollections().toArray();
      const userCollections = collections.filter(c => !c.name.startsWith('system.'));

      console.log(`  └─ Found ${userCollections.length} collection(s) in '${dbName}'\n`);

      for (const colInfo of userCollections) {
        const colName = colInfo.name;
        console.log(`  📄 Collection: [${colName}]`);

        const srcCol = srcDb.collection(colName);
        const destCol = destDb.collection(colName);

        // 1. Fetch & recreate Indexes (Schema)
        try {
          const rawIndexes = await srcCol.listIndexes().toArray();
          const indexesToCreate = rawIndexes
            .filter(idx => idx.name !== '_id_') // skip default _id index
            .map(idx => {
              const spec = { ...idx };
              delete spec.v;
              delete spec.ns;
              return spec;
            });

          if (indexesToCreate.length > 0) {
            for (const idxSpec of indexesToCreate) {
              const key = idxSpec.key;
              delete idxSpec.key;
              delete idxSpec.name;
              await destCol.createIndex(key, idxSpec);
            }
            console.log(`     └─ Recreated ${indexesToCreate.length} custom index(es)`);
          } else {
            console.log(`     └─ No custom indexes to recreate`);
          }
        } catch (idxErr) {
          console.warn(`     ⚠️ Warning copying indexes for ${colName}:`, idxErr.message);
        }

        // 2. Fetch & Copy Data
        const totalDocs = await srcCol.countDocuments();
        console.log(`     └─ Document count in source: ${totalDocs}`);

        if (totalDocs > 0) {
          // Clear destination collection before migration to prevent duplicate key errors if re-run
          await destCol.deleteMany({});

          const cursor = srcCol.find({});
          const BATCH_SIZE = 500;
          let batch = [];
          let insertedCount = 0;

          while (await cursor.hasNext()) {
            const doc = await cursor.next();
            batch.push(doc);

            if (batch.length >= BATCH_SIZE) {
              await destCol.insertMany(batch, { ordered: false });
              insertedCount += batch.length;
              batch = [];
            }
          }

          if (batch.length > 0) {
            await destCol.insertMany(batch, { ordered: false });
            insertedCount += batch.length;
          }

          const destCount = await destCol.countDocuments();
          console.log(`     └─ Migrated ${destCount}/${totalDocs} documents successfully! ✅`);
        } else {
          console.log(`     └─ Collection is empty, skipped document copy.`);
        }
        console.log('');
      }
    }

    console.log('🎉 Database Migration Completed Successfully!');

    // Update .env file if it exists in current folder or parent
    updateEnvFile(destUri);

  } catch (err) {
    if (err.message && err.message.includes('bad auth')) {
      console.error('\n❌ Authentication Failed (bad auth):');
      console.error('The username or password supplied in the connection string is incorrect for MongoDB Atlas.');
      console.error('Please verify your Database User credentials under MongoDB Atlas > Security > Database Access.\n');
    } else {
      console.error('❌ Migration failed with error:', err);
    }
    process.exit(1);
  } finally {
    await sourceClient.close().catch(() => {});
    await destClient.close().catch(() => {});
  }
}

function updateEnvFile(destUri) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Extract target db name if included or default to wagh-ecommerce
      const formattedUri = destUri.includes('/wagh-ecommerce') 
        ? destUri 
        : destUri.replace('/?', '/wagh-ecommerce?');

      if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(/^MONGODB_URI=.*$/m, `MONGODB_URI=${formattedUri}`);
      } else {
        envContent += `\nMONGODB_URI=${formattedUri}\n`;
      }

      fs.readFileSync(envPath);
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log(`\n⚙️ Updated .env file MONGODB_URI with the new Vercel Org connection string!`);
    } catch (e) {
      console.warn('⚠️ Could not automatically update .env file:', e.message);
    }
  }
}

function extractHost(uri) {
  try {
    const match = uri.match(/@([^/?]+)/);
    return match ? match[1] : 'unknown host';
  } catch (e) {
    return 'unknown host';
  }
}

migrate();
