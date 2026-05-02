const fs = require('fs');
const { Client } = require('pg');

const regions = [
  'ap-south-1', 'us-east-1', 'eu-central-1', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'ca-central-1', 'sa-east-1'
];

async function findRegion() {
  console.log('Testing Supabase regions to find your database...');
  for (const region of regions) {
    const uri = `postgresql://postgres.wqpyzriotvmokyofloxx:Vidya%232005rk@aws-0-${region}.pooler.supabase.com:5432/postgres`;
    const client = new Client({ connectionString: uri, connectionTimeoutMillis: 3000 });
    try {
      await client.connect();
      console.log(`\n✅ FOUND REGION: ${region}`);
      await client.end();
      
      const envContent = fs.readFileSync('.env', 'utf8');
      fs.writeFileSync('.env', envContent.replace(/DATABASE_URL=".+"/, `DATABASE_URL="${uri}"`));
      console.log('✅ Updated .env file automatically!');
      process.exit(0);
    } catch (e) {
      if (!e.message.includes('not found')) {
         console.log(`Region ${region} error:`, e.message);
      } else {
         process.stdout.write('.');
      }
    }
  }
  console.log('\n❌ Could not find region automatically.');
}

findRegion();
