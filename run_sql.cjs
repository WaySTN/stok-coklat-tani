const fs = require('fs');

async function run() {
  const sql = fs.readFileSync('supabase/migrations/20260711000000_initial_schema.sql', 'utf8');
  const res = await fetch('https://api.supabase.com/v1/projects/kdgbxklsasvgwnzekgfn/config/database/query', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sbp_e37a44cad73f9eba1c7537629040684ccdc83b95',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Error:', res.status, text);
    process.exit(1);
  }

  console.log('Success:', await res.json());
}

run();
