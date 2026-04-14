const fs = require('fs');

const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // FIX 1: async function await name -> async function name
    content = content.replace(/async function await /g, 'async function ');

    // FIX 2: [Number(groupId]) -> [Number(groupId)]
    content = content.replace(/\[Number\(groupId\]\)/g, '[Number(groupId)]');
    // Also happens for split.userId
    content = content.replace(/\[Number\(split\.userId\]\)/g, '[Number(split.userId)]');
    // Also [id])
    content = content.replace(/\[id\]\)/g, '[id]');
    
    // Actually, any mismatch `([A-Za-z0-9_.]+)\]\)` should probably be `([\1])]` or `[\1]`?
    // Let's just fix the specific ones
    content = content.replace(/Number\(groupId\]\)/g, 'Number(groupId)]');
    content = content.replace(/Number\(expenseId\]\)/g, 'Number(expenseId)]');
    content = content.replace(/Number\(id\]\)/g, 'Number(id)]');
    content = content.replace(/Number\(split\.userId\]\)/g, 'Number(split.userId)]');
    content = content.replace(/name\.trim\(\]\)/g, 'name.trim()]');

    // Wait! In `route.ts`, what does `await queryOne("...", [Number(groupId]), auth.userId);` mean?
    // It should be `await queryOne("...", [Number(groupId), auth.userId]);`
    content = content.replace(/\[Number\(groupId\]\), (auth\.userId|\w+)\);/g, '[Number(groupId), $1]);');
    content = content.replace(/\[Number\(groupId\]\)\);/g, '[Number(groupId)]);');
    content = content.replace(/\[Number\(groupId\]\)\) as (\{.*?\});/g, '[Number(groupId)]) as $1;');
    content = content.replace(/\[Number\(expenseId\]\)\);/g, '[Number(expenseId)]);');
    content = content.replace(/\[expenseId, Number\(split\.userId\]\), Number\(split\.amount\), split\.percentage \?\? null\);/g, '[expenseId, Number(split.userId), Number(split.amount), split.percentage ?? null]);');
    content = content.replace(/\[name\.trim\(\]\), groupId\);/g, '[name.trim(), groupId]);');
    content = content.replace(/\[name\.trim\(\]\), Number\(groupId\]\)\);/g, '[name.trim(), Number(groupId)]);');
    content = content.replace(/\[amount, description, date, splitMode, Number\(groupId\]\)\);/g, '[amount, description, date, splitMode, Number(groupId)]);');
    content = content.replace(/\[\], groupId\);/g, '[], groupId);'); 

    // General pattern that broke:
    // await execute("...", [variable]), variable2); 
    // It should be string matching the end. Let's just fix the specific cases because they're small.

    if (original !== content) {
      fs.writeFileSync(filePath, content);
    }
  }
});
