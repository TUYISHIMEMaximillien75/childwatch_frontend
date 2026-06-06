const fs = require('fs');
const path = require('path');

const dashboards = [
  'Admindashboard.jsx',
  'PoliceDashboard.jsx',
  'HealthCareDashboard.jsx',
  'InstitutionDashboard.jsx',
  'CommunityDashboard.jsx',
  'Reporter.jsx'
];

const basePath = path.join('c:\\Users\\Dell\\Desktop\\MATY Codes\\Child\\childAbuse-system\\frontend\\src\\pages');

dashboards.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if not present
  if (!content.includes('import { useTranslation }')) {
    content = content.replace(
      /import LanguageSwitcher from "([^"]+)";/,
      import LanguageSwitcher from "";\nimport { useTranslation } from "react-i18next";
    );
    changed = true;
  }

  // Find the main component function name
  const mainFuncMatch = content.match(/export default function ([A-Za-z0-9_]+)/);
  if (mainFuncMatch) {
    const funcName = mainFuncMatch[1];
    const funcRegex = new RegExp((export default function \\([^)]*\\)\\s*\\{\\s*));
    
    // Inject const { t } = useTranslation();
    if (!content.includes('const { t } = useTranslation()')) {
      content = content.replace(funcRegex, $1const { t } = useTranslation();\n  );
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(Updated );
  }
});
