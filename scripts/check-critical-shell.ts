const target = process.env.NEOVERSE_TEST_URL ?? 'http://localhost:3000/';
const response = await fetch(target);

if (!response.ok) {
  throw new Error(`Failed to load ${target}: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const criticalStyle = html.match(/<style[^>]+id="neoverse-critical-shell"[^>]*>([\s\S]*?)<\/style>/)?.[1];

if (!criticalStyle) {
  throw new Error('SSR HTML is missing the neoverse-critical-shell inline style.');
}

for (const requiredRule of ['.skip-link', '.dashboard-loading', '.home-cosmos__fallback', '[inert]']) {
  if (!criticalStyle.includes(requiredRule)) {
    throw new Error(`Critical shell is missing the ${requiredRule} fallback rule.`);
  }
}

console.log(`Critical shell is present in ${target}`);
