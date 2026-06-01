const fs = require('fs');
const path = require('path');

const groups = {
  common: ['COMMON', 'SIDEBAR', 'HEADER', 'HEADER_SEARCH', 'PAGINATION', 'ALERTS_CENTER'],
  auth: ['AUTH', 'LOGIN', 'REGISTER', 'FORGOT_PASSWORD_PAGE', 'RESET_PASSWORD_PAGE', 'ONBOARDING'],
  dashboard: ['DASHBOARD'],
  catalog: ['CATALOG', 'PRODUCTS'],
  offers: ['OFFERS'],
  orders: ['ORDERS', 'VENDOR_DISPUTES', 'SUPPORT_CENTER'],
  settings: ['SETTINGS_PROFILE', 'STAFF_BRANCHES', 'REVIEWS', 'VENDOR_FINANCE']
};

const languages = ['ar', 'en'];
const baseDir = path.join(__dirname, '../public/assets/i18n');

languages.forEach((lang) => {
  const filePath = path.join(baseDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);
  const dataKeys = Object.keys(data);

  // Initialize group objects
  const outputs = {};
  Object.keys(groups).forEach((groupName) => {
    outputs[groupName] = {};
  });

  // Distribute keys
  dataKeys.forEach((key) => {
    let matched = false;
    for (const [groupName, keysList] of Object.entries(groups)) {
      if (keysList.includes(key)) {
        outputs[groupName][key] = data[key];
        matched = true;
        break;
      }
    }

    if (!matched) {
      console.warn(`[Warning] Key "${key}" in ${lang}.json did not match any group. Adding to "common".`);
      outputs['common'][key] = data[key];
    }
  });

  // Ensure output directory exists
  const langDir = path.join(baseDir, lang);
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  // Write files
  Object.entries(outputs).forEach(([groupName, content]) => {
    const outputPath = path.join(langDir, `${groupName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Wrote ${outputPath} (${Object.keys(content).length} keys)`);
  });
});

console.log('Successfully split translation files!');
