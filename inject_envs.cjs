const { spawnSync } = require('child_process');

const envs = [
  { name: 'VITE_SUPABASE_URL', value: 'https://ftwwkakvgfzrkssqyscd.supabase.co' },
  { name: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0d3drYWt2Z2Z6cmtzc3F5c2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDE0NTcsImV4cCI6MjA4NjUxNzQ1N30.rMrL0pCDmXJsfy71AExCM16WOLWrviPQfFf0s1wnN0I' },
  { name: 'VITE_MERCADO_PAGO_PUBLIC_KEY', value: 'APP_USR-e93e1a3c-2d69-4c46-85af-9096dda4ab61' },
  { name: 'VITE_MERCADO_PAGO_ACCESS_TOKEN', value: 'APP_USR-1454307950243464-021021-545a78fabec64ccba3c1d543f1457534-608431650' },
  { name: 'VITE_ENV', value: 'PRODUCTION' }
];

function runCommand(cmd, args, input) {
  console.log(`Running: ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { input, encoding: 'utf8', shell: true });
  if (result.error) {
    console.error('Error:', result.error);
  }
  return result.stdout + result.stderr;
}

console.log('--- STARTING CONTROLLED INJECTION ---');

// 1. Clean existing
for (const env of envs) {
  console.log(`Cleaning ${env.name}...`);
  runCommand('npx', ['vercel', 'env', 'rm', env.name, 'production', '-y']);
}

// 2. Inject
for (const env of envs) {
  console.log(`Injecting ${env.name}...`);
  // Using the multi-input pipe simulation
  // We send 'y' (for VITE warning) and then the value.
  const input = `y\n${env.value}\n`;
  const output = runCommand('npx', ['vercel', 'env', 'add', env.name, 'production'], input);
  console.log(output);
}

// 3. Final Verification
console.log('--- FINAL VERIFICATION ---');
const listOutput = runCommand('npx', ['vercel', 'env', 'ls', 'production']);
console.log(listOutput);

console.log('--- DONE ---');
