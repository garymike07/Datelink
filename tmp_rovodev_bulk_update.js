const fs = require('fs');

const files = [
  'src/pages/Chat.tsx',
  'src/pages/Likes.tsx',
  'src/pages/Matches.tsx',
  'src/pages/Messages.tsx',
  'src/pages/PhotoVerification.tsx',
  'src/pages/PublicProfile.tsx',
  'src/pages/Safety.tsx',
  'src/pages/Subscription.tsx',
  'src/pages/TopPicks.tsx',
  'src/pages/Upgrade.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add import if not present
  if (!content.includes('useAuth')) {
    content = content.replace(
      /(import.*from ['"]react['"];)/,
      '$1\nimport { useAuth } from "@/contexts/AuthContext";'
    );
  }
  
  // Replace localStorage.getItem("user") patterns
  content = content.replace(
    /const\s+(\w+)\s+=\s+JSON\.parse\(localStorage\.getItem\("user"\)\s*\|\|\s*"{}"\);?/g,
    'const { user: $1 } = useAuth();'
  );
  
  content = content.replace(
    /const\s+(\w+)\s+=\s+useMemo\(\(\)\s*=>\s*JSON\.parse\(localStorage\.getItem\("user"\)\s*\|\|\s*"{}"\),\s*\[\]\);?/g,
    'const { user: $1 } = useAuth();'
  );
  
  content = content.replace(
    /const\s+(\w+)\s+=\s+localStorage\.getItem\("user"\);?/g,
    'const { user: $1 } = useAuth();'
  );
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
