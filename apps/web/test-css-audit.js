const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '.next', 'static', 'css');
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

if (cssFiles.length === 0) {
  console.error('No CSS bundles found in', cssDir);
  process.exit(1);
}

for (const file of cssFiles) {
  const filePath = path.join(cssDir, file);
  const css = fs.readFileSync(filePath, 'utf8');
  console.log(`Auditing CSS Bundle: ${file} (${css.length} bytes)`);

  // Check 1: Actual Gradients (linear-gradient, radial-gradient, conic-gradient)
  const actualGradientMatches = css.match(/(?:linear|radial|conic)-gradient\([^)]+\)/gi) || [];
  console.log(`- Actual gradient functions found (${actualGradientMatches.length}):`, actualGradientMatches);

  // Check 2: Box Shadows
  const rawShadowMatches = css.match(/box-shadow:[^;]+;/gi) || [];
  console.log(`- Raw box shadow declarations (${rawShadowMatches.length}):`);
  rawShadowMatches.forEach(m => console.log(`    ${m}`));

  // Non-reset shadows
  const nonResetShadows = rawShadowMatches.filter(m => !m.includes('none!important') && !m.includes('none}'));
  console.log(`- Non-reset drop shadows:`, nonResetShadows);

  // Check 3: App Font Weights
  const appFontWeights = Array.from(new Set(
    (css.match(/font-weight:[^;{}]+/gi) || [])
  ));
  console.log(`- Concrete font-weight rules found in CSS:`, appFontWeights);

  const hasProhibitedWeights = appFontWeights.some(w => /\b(?:600|700|800|900|bold|semibold)\b/i.test(w));
  console.log(`- Has prohibited font weights (>500 or bold):`, hasProhibitedWeights);

  // Check 4: Enforced flat & weight rules
  const hasBoxShadowNoneImportant = css.includes('box-shadow:none!important');
  const hasFontWeight500Important = css.includes('font-weight:500!important');
  console.log(`- Global flat override (box-shadow: none !important):`, hasBoxShadowNoneImportant);
  console.log(`- Global weight lock (font-weight: 500 !important for headings/b/strong):`, hasFontWeight500Important);

  if (
    actualGradientMatches.length === 0 &&
    nonResetShadows.length === 0 &&
    !hasProhibitedWeights &&
    hasBoxShadowNoneImportant &&
    hasFontWeight500Important
  ) {
    console.log(`\nVISUAL_COMPLIANCE_PASSED for ${file}`);
  } else {
    console.error(`\nVISUAL_COMPLIANCE_FAILED for ${file}`);
    process.exit(1);
  }

}
